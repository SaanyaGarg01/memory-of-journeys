// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import mariadb from 'mariadb';
import crypto from 'node:crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ---- MariaDB connection pool ----
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'memory_of_journeys',
  connectionLimit: 5
});

app.delete('/api/albums/:albumId/photos/:photoId', async (req, res) => {
  const { albumId, photoId } = req.params;
  if (!albumId || !photoId) return res.status(400).json({ error: 'Missing albumId or photoId' });
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM album_photos WHERE id = ? AND album_id = ?', [photoId, albumId]);
    if (result.affectedRows > 0) return res.status(204).send();
    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('❌ Delete album photo failed:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Album Pages (notes) ----
app.get('/api/albums/:albumId/pages', async (req, res) => {
  const { albumId } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT page_number, content, updated_at FROM album_pages WHERE album_id = ? ORDER BY page_number ASC', [albumId]);
    res.json(rows.map(r => ({ page_number: Number(r.page_number), content: r.content || '', updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '' })));
  } catch (err) {
    console.error('❌ Get album pages failed:', err);
    res.status(500).json({ error: 'Failed to get pages' });
  } finally {
    if (conn) conn.release();
  }
});

app.put('/api/albums/:albumId/pages/:pageNumber', async (req, res) => {
  const { albumId, pageNumber } = req.params;
  const content = (req.body && req.body.content) ? String(req.body.content) : '';
  let conn;
  try {
    conn = await pool.getConnection();
    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO album_pages (id, album_id, page_number, content, updated_at) VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()`,
      [id, albumId, Number(pageNumber), content]
    );
    const rows = await conn.query('SELECT page_number, content, updated_at FROM album_pages WHERE album_id = ? AND page_number = ? LIMIT 1', [albumId, Number(pageNumber)]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({ page_number: Number(r.page_number), content: r.content || '', updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '' });
  } catch (err) {
    console.error('❌ Update album page failed:', err);
    res.status(500).json({ error: 'Failed to update page' });
  } finally {
    if (conn) conn.release();
  }
});

// Alternate upsert via POST (body: { page_number, content })
app.post('/api/albums/:albumId/pages', async (req, res) => {
  const { albumId } = req.params;
  const num = Number(req.body?.page_number || 1);
  const content = (req.body && req.body.content) ? String(req.body.content) : '';
  let conn;
  try {
    conn = await pool.getConnection();
    const id = crypto.randomUUID();
    await conn.query(
      `INSERT INTO album_pages (id, album_id, page_number, content, updated_at) VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = NOW()`,
      [id, albumId, num, content]
    );
    const rows = await conn.query('SELECT page_number, content, updated_at FROM album_pages WHERE album_id = ? AND page_number = ? LIMIT 1', [albumId, num]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({ page_number: Number(r.page_number), content: r.content || '', updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '' });
  } catch (err) {
    console.error('❌ Upsert album page (POST) failed:', err);
    res.status(500).json({ error: 'Failed to save page' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Albums ----
app.post('/api/albums', async (req, res) => {
  const b = req.body || {};
  if (!b.user_id || !b.title) return res.status(400).json({ error: 'Missing user_id or title' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO albums (id, user_id, title, description, journey_id, visibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, b.user_id, b.title, b.description || '', b.journey_id || null, b.visibility || 'public']
    );
    res.status(201).json({ id, ...b });
  } catch (err) {
    console.error('❌ Create album failed:', err);
    res.status(500).json({ error: 'Failed to create album' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/albums', async (req, res) => {
  const userId = req.query.user_id?.toString();
  let conn;
  try {
    conn = await pool.getConnection();
    let rows;
    if (userId) {
      rows = await conn.query('SELECT * FROM albums WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    } else {
      rows = await conn.query("SELECT * FROM albums WHERE visibility='public' ORDER BY created_at DESC LIMIT 50");
    }
    res.json(rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || '',
      journey_id: r.journey_id || null,
      visibility: r.visibility,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List albums failed:', err);
    res.status(500).json([]);
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/albums/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM albums WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      id: r.id, user_id: r.user_id, title: r.title, description: r.description || '',
      journey_id: r.journey_id || null, visibility: r.visibility,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    });
  } catch (err) {
    console.error('❌ Get album failed:', err);
    res.status(500).json({ error: 'Failed to get album' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Album Photos ----
app.post('/api/albums/:id/photos', async (req, res) => {
  const albumId = req.params.id;
  const b = req.body || {};
  if (!albumId || !b.user_id || !b.image_url) return res.status(400).json({ error: 'Missing albumId, user_id or image_url' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO album_photos (id, album_id, user_id, image_url, caption, page_number, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [id, albumId, b.user_id, b.image_url, b.caption || '', Number(b.page_number || 1)]
    );
    res.status(201).json({ id, album_id: albumId, ...b });
  } catch (err) {
    console.error('❌ Add album photo failed:', err);
    res.status(500).json({ error: 'Failed to add photo' });
  } finally {
    if (conn) conn.release();
  }
});

app.get('/api/albums/:id/photos', async (req, res) => {
  const albumId = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM album_photos WHERE album_id = ? ORDER BY page_number ASC, created_at ASC', [albumId]);
    res.json(rows.map(r => ({
      id: r.id,
      album_id: r.album_id,
      user_id: r.user_id,
      image_url: r.image_url,
      caption: r.caption || '',
      page_number: Number(r.page_number || 1),
      meta: safeJson(r.meta, {}),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List album photos failed:', err);
    res.status(500).json([]);
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: List journeys for a specific user ----
app.get('/api/users/:userId/journeys', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM journeys WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [userId]);
    const data = rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || '',
      journey_type: r.journey_type,
      departure_date: fmtDate(r.departure_date),
      return_date: fmtDate(r.return_date),
      legs: safeJson(r.legs, []),
      keywords: safeJson(r.keywords, []),
      ai_story: r.ai_story || '',
      similarity_score: Number(r.similarity_score || 0),
      rarity_score: Number(r.rarity_score || 50),
      cultural_insights: safeJson(r.cultural_insights, {}),
      visibility: r.visibility,
      likes_count: Number(r.likes_count || 0),
      views_count: Number(r.views_count || 0),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    }));
    res.json(data);
  } catch (err) {
    console.error('❌ List user journeys failed:', err);
    res.status(500).json([]);
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Update a journey ----
app.put('/api/journeys/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const j = req.body || {};
  const fields = {
    title: j.title,
    description: j.description ?? '',
    journey_type: j.journey_type,
    departure_date: j.departure_date,
    return_date: j.return_date,
    legs: JSON.stringify(j.legs || []),
    keywords: JSON.stringify(j.keywords || []),
    visibility: j.visibility || 'public'
  };
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `UPDATE journeys SET 
        title = ?, description = ?, journey_type = ?, departure_date = ?, return_date = ?,
        legs = ?, keywords = ?, visibility = ?, updated_at = NOW()
       WHERE id = ?`,
      [fields.title, fields.description, fields.journey_type, fields.departure_date, fields.return_date,
       fields.legs, fields.keywords, fields.visibility, id]
    );
    const rows = await conn.query('SELECT * FROM journeys WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    return res.json({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || '',
      journey_type: r.journey_type,
      departure_date: fmtDate(r.departure_date),
      return_date: fmtDate(r.return_date),
      legs: safeJson(r.legs, []),
      keywords: safeJson(r.keywords, []),
      ai_story: r.ai_story || '',
      similarity_score: Number(r.similarity_score || 0),
      rarity_score: Number(r.rarity_score || 50),
      cultural_insights: safeJson(r.cultural_insights, {}),
      visibility: r.visibility,
      likes_count: Number(r.likes_count || 0),
      views_count: Number(r.views_count || 0),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    });
  } catch (err) {
    console.error('❌ Update journey failed:', err);
    res.status(500).json({ error: 'Failed to update journey' });
  } finally {
    if (conn) conn.release();
  }
});

async function initSchema() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS journeys (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        journey_type VARCHAR(32) DEFAULT 'solo',
        departure_date DATE,
        return_date DATE,
        legs TEXT NOT NULL,
        keywords TEXT,
        ai_story TEXT,
        similarity_score FLOAT DEFAULT 0,
        rarity_score FLOAT DEFAULT 50,
        cultural_insights TEXT,
        visibility VARCHAR(16) DEFAULT 'public',
        likes_count INT DEFAULT 0,
        views_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_journeys_visibility (visibility),
        INDEX idx_journeys_type (journey_type),
        INDEX idx_journeys_created (created_at)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS journey_views (
        id CHAR(36) PRIMARY KEY,
        journey_id CHAR(36) NOT NULL,
        viewer_id VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_journey_viewer (journey_id, viewer_id),
        INDEX idx_journey_views_journey (journey_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        journey_id CHAR(36),
        visibility VARCHAR(16) DEFAULT 'public',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_albums_user (user_id),
        INDEX idx_albums_created (created_at)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS album_photos (
        id CHAR(36) PRIMARY KEY,
        album_id CHAR(36) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        image_url TEXT NOT NULL,
        caption VARCHAR(500),
        page_number INT DEFAULT 1,
        meta TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_album_photos_album (album_id),
        INDEX idx_album_photos_page (album_id, page_number)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS album_pages (
        id CHAR(36) PRIMARY KEY,
        album_id CHAR(36) NOT NULL,
        page_number INT NOT NULL,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_album_page (album_id, page_number)
      ) ENGINE=InnoDB;
    `);
    console.log('✅ MariaDB schema ready');
  } catch (err) {
    console.error('❌ MariaDB init error:', err);
  } finally {
    if (conn) conn.release();
  }
}

// ---- API: Create journey ----
app.post('/api/journeys', async (req, res) => {
  const j = req.body || {};
  // Basic validation
  if (!j.title || !Array.isArray(j.legs) || j.legs.length === 0) {
    return res.status(400).json({ error: 'Invalid journey payload' });
  }
  const id = j.id && String(j.id).length ? j.id : crypto.randomUUID();
  const now = new Date();
  const doc = {
    id,
    user_id: j.user_id || `anon_${id}`,
    title: j.title,
    description: j.description || '',
    journey_type: j.journey_type || 'solo',
    departure_date: j.departure_date || now.toISOString().slice(0, 10),
    return_date: j.return_date || j.departure_date || now.toISOString().slice(0, 10),
    legs: JSON.stringify(j.legs || []),
    keywords: JSON.stringify(j.keywords || []),
    ai_story: j.ai_story || '',
    similarity_score: j.similarity_score ?? 0,
    rarity_score: j.rarity_score ?? 50,
    cultural_insights: JSON.stringify(j.cultural_insights || {}),
    visibility: j.visibility || 'public',
    likes_count: j.likes_count ?? 0,
    views_count: j.views_count ?? 0
  };

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO journeys (
        id, user_id, title, description, journey_type, departure_date, return_date,
        legs, keywords, ai_story, similarity_score, rarity_score, cultural_insights,
        visibility, likes_count, views_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        doc.id, doc.user_id, doc.title, doc.description, doc.journey_type, doc.departure_date, doc.return_date,
        doc.legs, doc.keywords, doc.ai_story, doc.similarity_score, doc.rarity_score, doc.cultural_insights,
        doc.visibility, doc.likes_count, doc.views_count
      ]
    );

    // Return normalized object matching frontend types
    const response = {
      ...j,
      id: doc.id,
      user_id: doc.user_id,
      departure_date: doc.departure_date,
      return_date: doc.return_date,
      legs: JSON.parse(doc.legs),
      keywords: JSON.parse(doc.keywords),
      cultural_insights: JSON.parse(doc.cultural_insights),
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    res.status(201).json(response);
  } catch (err) {
    console.error('❌ Create journey failed:', err);
    res.status(500).json({ error: 'Failed to create journey' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: List public journeys (Explore) ----
app.get('/api/journeys', async (req, res) => {
  const visibility = (req.query.visibility || 'public').toString();
  const journeyType = req.query.journey_type ? req.query.journey_type.toString() : null;
  const limit = Math.min(parseInt(req.query.limit?.toString() || '20', 10) || 20, 100);

  let conn;
  try {
    conn = await pool.getConnection();
    const params = [visibility, limit];
    let sql = `SELECT * FROM journeys WHERE visibility = ?`;
    if (journeyType && journeyType !== 'all') {
      sql += ' AND journey_type = ?';
      params.splice(1, 0, journeyType);
    }
    sql += ' ORDER BY created_at DESC LIMIT ?';

    const rows = await conn.query(sql, params);
    const data = rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description || '',
      journey_type: r.journey_type,
      departure_date: fmtDate(r.departure_date),
      return_date: fmtDate(r.return_date),
      legs: safeJson(r.legs, []),
      keywords: safeJson(r.keywords, []),
      ai_story: r.ai_story || '',
      similarity_score: Number(r.similarity_score || 0),
      rarity_score: Number(r.rarity_score || 50),
      cultural_insights: safeJson(r.cultural_insights, {}),
      visibility: r.visibility,
      likes_count: Number(r.likes_count || 0),
      views_count: Number(r.views_count || 0),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    }));
    res.json(data);
  } catch (err) {
    console.error('❌ List journeys failed:', err);
    res.status(500).json([]);
  } finally {
    if (conn) conn.release();
  }
});

function safeJson(txt, fallback) {
  if (txt == null) return fallback;
  try { return JSON.parse(String(txt)); } catch { return fallback; }
}

function fmtDate(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  try { return val.toISOString().slice(0, 10); } catch { return String(val).slice(0, 10); }
}

// ---- API: Delete a journey ----
app.delete('/api/journeys/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM journeys WHERE id = ?', [id]);
    if (result.affectedRows > 0) return res.status(204).send();
    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('❌ Delete journey failed:', err);
    res.status(500).json({ error: 'Failed to delete journey' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Like a journey (persist) ----
app.post('/api/journeys/:id/like', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('UPDATE journeys SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    const rows = await conn.query('SELECT likes_count FROM journeys WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    return res.json({ id, likes_count: Number(rows[0].likes_count || 0) });
  } catch (err) {
    console.error('❌ Like journey failed:', err);
    res.status(500).json({ error: 'Failed to like journey' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: Record a view (per viewer) ----
app.post('/api/journeys/:id/view', async (req, res) => {
  const id = req.params.id;
  const viewer = (req.body && req.body.viewer_id) ? String(req.body.viewer_id) : '';
  if (!id) return res.status(400).json({ error: 'Missing id' });
  if (!viewer) return res.status(400).json({ error: 'Missing viewer_id' });
  let conn;
  try {
    conn = await pool.getConnection();
    const viewId = crypto.randomUUID();
    // Insert unique viewer; if new, increment journey views_count
    const result = await conn.query(
      'INSERT IGNORE INTO journey_views (id, journey_id, viewer_id) VALUES (?, ?, ?)',
      [viewId, id, viewer]
    );
    if (result.affectedRows > 0) {
      await conn.query('UPDATE journeys SET views_count = views_count + 1 WHERE id = ?', [id]);
    }
    const countRows = await conn.query('SELECT COUNT(*) AS total FROM journey_views WHERE journey_id = ?', [id]);
    const total = Number(countRows?.[0]?.total || 0);
    res.json({ id, viewer_id: viewer, total });
  } catch (err) {
    console.error('❌ Record view failed:', err);
    res.status(500).json({ error: 'Failed to record view' });
  } finally {
    if (conn) conn.release();
  }
});

// ---- API: List viewers ----
app.get('/api/journeys/:id/views', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT viewer_id, created_at FROM journey_views WHERE journey_id = ? ORDER BY created_at DESC LIMIT 50', [id]);
    const totalRows = await conn.query('SELECT COUNT(*) AS total FROM journey_views WHERE journey_id = ?', [id]);
    res.json({ total: Number(totalRows?.[0]?.total || 0), viewers: rows });
  } catch (err) {
    console.error('❌ Fetch views failed:', err);
    res.status(500).json({ error: 'Failed to fetch views' });
  } finally {
    if (conn) conn.release();
  }
});

app.listen(PORT, async () => {
  await initSchema();
  console.log(`✅ API server running at http://localhost:${PORT}`);
});
