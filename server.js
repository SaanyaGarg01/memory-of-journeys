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

// ---- API: Future Plans ----
app.get('/api/users/:userId/plans', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM future_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [userId]);
    res.json(rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      destination: r.destination,
      start_date: r.start_date ? new Date(r.start_date).toISOString().slice(0,10) : '',
      end_date: r.end_date ? new Date(r.end_date).toISOString().slice(0,10) : '',
      reason: r.reason || '',
      notes: r.notes || '',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List future plans failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

app.post('/api/plans', async (req, res) => {
  const b = req.body || {};
  if (!b.user_id || !b.destination) return res.status(400).json({ error: 'Missing user_id or destination' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO future_plans (id, user_id, destination, start_date, end_date, reason, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, b.user_id, b.destination, b.start_date || null, b.end_date || null, b.reason || '', b.notes || '']
    );
    res.status(201).json({ id, ...b });
  } catch (err) {
    console.error('❌ Create plan failed:', err);
    res.status(500).json({ error: 'Failed to create plan' });
  } finally { if (conn) conn.release(); }
});

app.put('/api/plans/:id', async (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `UPDATE future_plans SET destination = ?, start_date = ?, end_date = ?, reason = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
      [b.destination || '', b.start_date || null, b.end_date || null, b.reason || '', b.notes || '', id]
    );
    const rows = await conn.query('SELECT * FROM future_plans WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      id: r.id,
      user_id: r.user_id,
      destination: r.destination,
      start_date: r.start_date ? new Date(r.start_date).toISOString().slice(0,10) : '',
      end_date: r.end_date ? new Date(r.end_date).toISOString().slice(0,10) : '',
      reason: r.reason || '',
      notes: r.notes || '',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    });
  } catch (err) {
    console.error('❌ Update plan failed:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  } finally { if (conn) conn.release(); }
});

app.delete('/api/plans/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM future_plans WHERE id = ?', [id]);
    if (result.affectedRows > 0) return res.status(204).send();
    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('❌ Delete plan failed:', err);
    res.status(500).json({ error: 'Failed to delete plan' });
  } finally { if (conn) conn.release(); }
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS future_plans (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        reason TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_future_plans_user (user_id),
        INDEX idx_future_plans_dates (start_date, end_date)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS memory_circles (
        id CHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_memory_circles_owner (owner_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS memory_circle_members (
        id CHAR(36) PRIMARY KEY,
        circle_id CHAR(36) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        role VARCHAR(32) DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_circle_member (circle_id, user_id),
        INDEX idx_circle_members_circle (circle_id),
        INDEX idx_circle_members_user (user_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS memory_circle_journeys (
        id CHAR(36) PRIMARY KEY,
        circle_id CHAR(36) NOT NULL,
        journey_id CHAR(36) NOT NULL,
        shared_by VARCHAR(64) NOT NULL,
        shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_circle_journey (circle_id, journey_id),
        INDEX idx_circle_journeys_circle (circle_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS collaborative_journals (
        id CHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        journey_id CHAR(36),
        created_by VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collab_journals_creator (created_by)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS collaborative_journal_members (
        id CHAR(36) PRIMARY KEY,
        journal_id CHAR(36) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255),
        role VARCHAR(32) DEFAULT 'contributor',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_journal_member (journal_id, user_id),
        INDEX idx_journal_members_journal (journal_id),
        INDEX idx_journal_members_user (user_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS collaborative_journal_entries (
        id CHAR(36) PRIMARY KEY,
        journal_id CHAR(36) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255),
        content TEXT NOT NULL,
        entry_type VARCHAR(32) DEFAULT 'text',
        image_url TEXT,
        location VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_journal_entries_journal (journal_id),
        INDEX idx_journal_entries_created (created_at)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS anonymous_memories (
        id CHAR(36) PRIMARY KEY,
        journey_id CHAR(36) NOT NULL,
        original_user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        story TEXT NOT NULL,
        location VARCHAR(255),
        travel_type VARCHAR(32),
        keywords TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_anon_memories_available (is_available),
        INDEX idx_anon_memories_type (travel_type)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS memory_exchanges (
        id CHAR(36) PRIMARY KEY,
        user1_id VARCHAR(64) NOT NULL,
        user2_id VARCHAR(64) NOT NULL,
        memory1_id CHAR(36) NOT NULL,
        memory2_id CHAR(36) NOT NULL,
        exchanged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_memory_exchanges_user1 (user1_id),
        INDEX idx_memory_exchanges_user2 (user2_id)
      ) ENGINE=InnoDB;
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_friends (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        friend_id VARCHAR(64) NOT NULL,
        friend_name VARCHAR(255),
        friend_email VARCHAR(255),
        friend_avatar VARCHAR(500),
        status VARCHAR(20) DEFAULT 'active',
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_friends_user (user_id),
        INDEX idx_user_friends_friend (friend_id),
        UNIQUE KEY uniq_user_friend (user_id, friend_id)
      ) ENGINE=InnoDB;
    `);
    
    // Memory Garden Plants
    await conn.query(`
      CREATE TABLE IF NOT EXISTS memory_garden_plants (
        id CHAR(36) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        journey_id CHAR(36),
        plant_type VARCHAR(50) NOT NULL,
        plant_name VARCHAR(255),
        growth_stage INT DEFAULT 1,
        planted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_watered DATETIME DEFAULT CURRENT_TIMESTAMP,
        position_x INT DEFAULT 0,
        position_y INT DEFAULT 0,
        color VARCHAR(20),
        INDEX idx_garden_user (user_id),
        INDEX idx_garden_journey (journey_id)
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
    
    // Auto-plant a flower in the garden if user is authenticated
    if (doc.user_id && !doc.user_id.startsWith('anon_')) {
      const plantTypes = ['rose', 'tulip', 'sunflower', 'lotus', 'orchid', 'lily', 'daisy', 'cherry_blossom'];
      const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f472b6'];
      const randomPlant = plantTypes[Math.floor(Math.random() * plantTypes.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const plantId = crypto.randomUUID();
      await conn.query(
        `INSERT INTO memory_garden_plants 
         (id, user_id, journey_id, plant_type, plant_name, growth_stage, position_x, position_y, color) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [plantId, doc.user_id, doc.id, randomPlant, j.title || randomPlant, 
         Math.floor(Math.random() * 700) + 50, Math.floor(Math.random() * 500) + 50, randomColor]
      );
    }

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

// ---- API: Memory Circles ----
app.post('/api/memory-circles', async (req, res) => {
  const { name, description, owner_id } = req.body || {};
  if (!name || !owner_id) return res.status(400).json({ error: 'Missing name or owner_id' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO memory_circles (id, name, description, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [id, name, description || '', owner_id]
    );
    // Auto-add owner as admin member
    const memberId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO memory_circle_members (id, circle_id, user_id, role, joined_at) VALUES (?, ?, ?, 'admin', NOW())`,
      [memberId, id, owner_id]
    );
    res.status(201).json({ id, name, description, owner_id });
  } catch (err) {
    console.error('❌ Create memory circle failed:', err);
    res.status(500).json({ error: 'Failed to create memory circle' });
  } finally { if (conn) conn.release(); }
});

app.get('/api/memory-circles', async (req, res) => {
  const userId = req.query.user_id?.toString();
  let conn;
  try {
    conn = await pool.getConnection();
    let rows;
    if (userId) {
      rows = await conn.query(
        `SELECT mc.*, mcm.role FROM memory_circles mc 
         INNER JOIN memory_circle_members mcm ON mc.id = mcm.circle_id 
         WHERE mcm.user_id = ? ORDER BY mc.created_at DESC`,
        [userId]
      );
    } else {
      rows = await conn.query('SELECT * FROM memory_circles ORDER BY created_at DESC LIMIT 50');
    }
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      owner_id: r.owner_id,
      role: r.role || 'member',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List memory circles failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

app.get('/api/memory-circles/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM memory_circles WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const members = await conn.query('SELECT * FROM memory_circle_members WHERE circle_id = ?', [id]);
    const journeys = await conn.query(
      `SELECT j.*, mcj.shared_by, mcj.shared_at FROM journeys j 
       INNER JOIN memory_circle_journeys mcj ON j.id = mcj.journey_id 
       WHERE mcj.circle_id = ? ORDER BY mcj.shared_at DESC`,
      [id]
    );
    const r = rows[0];
    res.json({
      id: r.id,
      name: r.name,
      description: r.description || '',
      owner_id: r.owner_id,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      members: members.map(m => ({ user_id: m.user_id, role: m.role, joined_at: m.joined_at })),
      journeys: journeys.map(j => ({
        id: j.id,
        title: j.title,
        shared_by: j.shared_by,
        shared_at: j.shared_at,
        legs: safeJson(j.legs, [])
      }))
    });
  } catch (err) {
    console.error('❌ Get memory circle failed:', err);
    res.status(500).json({ error: 'Failed to get memory circle' });
  } finally { if (conn) conn.release(); }
});

app.post('/api/memory-circles/:id/members', async (req, res) => {
  const circleId = req.params.id;
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO memory_circle_members (id, circle_id, user_id, role, joined_at) VALUES (?, ?, ?, 'member', NOW())`,
      [id, circleId, user_id]
    );
    res.status(201).json({ id, circle_id: circleId, user_id, role: 'member' });
  } catch (err) {
    console.error('❌ Add member failed:', err);
    res.status(500).json({ error: 'Failed to add member' });
  } finally { if (conn) conn.release(); }
});

app.post('/api/memory-circles/:id/journeys', async (req, res) => {
  const circleId = req.params.id;
  const { journey_id, shared_by } = req.body || {};
  if (!journey_id || !shared_by) return res.status(400).json({ error: 'Missing journey_id or shared_by' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO memory_circle_journeys (id, circle_id, journey_id, shared_by, shared_at) VALUES (?, ?, ?, ?, NOW())`,
      [id, circleId, journey_id, shared_by]
    );
    res.status(201).json({ id, circle_id: circleId, journey_id, shared_by });
  } catch (err) {
    console.error('❌ Share journey to circle failed:', err);
    res.status(500).json({ error: 'Failed to share journey' });
  } finally { if (conn) conn.release(); }
});

// ---- API: Collaborative Journals ----
app.post('/api/collaborative-journals', async (req, res) => {
  const { title, description, journey_id, created_by, members } = req.body || {};
  if (!title || !created_by) return res.status(400).json({ error: 'Missing title or created_by' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO collaborative_journals (id, title, description, journey_id, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, title, description || '', journey_id || null, created_by]
    );
    // Auto-add creator as admin
    const creatorMemberId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO collaborative_journal_members (id, journal_id, user_id, role, joined_at) VALUES (?, ?, ?, 'admin', NOW())`,
      [creatorMemberId, id, created_by]
    );
    // Add other members if provided
    if (Array.isArray(members)) {
      for (const member of members) {
        if (member.user_id !== created_by) {
          const memberId = crypto.randomUUID();
          await conn.query(
            `INSERT INTO collaborative_journal_members (id, journal_id, user_id, user_name, role, joined_at) 
             VALUES (?, ?, ?, ?, 'contributor', NOW())`,
            [memberId, id, member.user_id, member.user_name || '']
          );
        }
      }
    }
    res.status(201).json({ id, title, description, created_by });
  } catch (err) {
    console.error('❌ Create collaborative journal failed:', err);
    res.status(500).json({ error: 'Failed to create collaborative journal' });
  } finally { if (conn) conn.release(); }
});

app.get('/api/collaborative-journals', async (req, res) => {
  const userId = req.query.user_id?.toString();
  let conn;
  try {
    conn = await pool.getConnection();
    let rows;
    if (userId) {
      rows = await conn.query(
        `SELECT cj.*, cjm.role FROM collaborative_journals cj 
         INNER JOIN collaborative_journal_members cjm ON cj.id = cjm.journal_id 
         WHERE cjm.user_id = ? ORDER BY cj.updated_at DESC`,
        [userId]
      );
    } else {
      rows = await conn.query('SELECT * FROM collaborative_journals ORDER BY updated_at DESC LIMIT 50');
    }
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      created_by: r.created_by,
      role: r.role || 'contributor',
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List collaborative journals failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

app.get('/api/collaborative-journals/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM collaborative_journals WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const members = await conn.query('SELECT * FROM collaborative_journal_members WHERE journal_id = ?', [id]);
    const entries = await conn.query(
      'SELECT * FROM collaborative_journal_entries WHERE journal_id = ? ORDER BY created_at ASC',
      [id]
    );
    const r = rows[0];
    res.json({
      id: r.id,
      title: r.title,
      description: r.description || '',
      journey_id: r.journey_id,
      created_by: r.created_by,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : '',
      members: members.map(m => ({ user_id: m.user_id, user_name: m.user_name, role: m.role })),
      entries: entries.map(e => ({
        id: e.id,
        user_id: e.user_id,
        user_name: e.user_name,
        content: e.content,
        entry_type: e.entry_type,
        image_url: e.image_url,
        location: e.location,
        created_at: e.created_at ? new Date(e.created_at).toISOString() : ''
      }))
    });
  } catch (err) {
    console.error('❌ Get collaborative journal failed:', err);
    res.status(500).json({ error: 'Failed to get journal' });
  } finally { if (conn) conn.release(); }
});

app.post('/api/collaborative-journals/:id/entries', async (req, res) => {
  const journalId = req.params.id;
  const { user_id, user_name, content, entry_type, image_url, location } = req.body || {};
  if (!user_id || !content) return res.status(400).json({ error: 'Missing user_id or content' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO collaborative_journal_entries (id, journal_id, user_id, user_name, content, entry_type, image_url, location, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, journalId, user_id, user_name || '', content, entry_type || 'text', image_url || null, location || '']
    );
    // Update journal's updated_at
    await conn.query('UPDATE collaborative_journals SET updated_at = NOW() WHERE id = ?', [journalId]);
    res.status(201).json({ id, journal_id: journalId, user_id, content });
  } catch (err) {
    console.error('❌ Add journal entry failed:', err);
    res.status(500).json({ error: 'Failed to add entry' });
  } finally { if (conn) conn.release(); }
});

app.post('/api/collaborative-journals/:id/members', async (req, res) => {
  const journalId = req.params.id;
  const { user_id, user_name } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO collaborative_journal_members (id, journal_id, user_id, user_name, role, joined_at) 
       VALUES (?, ?, ?, ?, 'contributor', NOW())`,
      [id, journalId, user_id, user_name || '']
    );
    res.status(201).json({ id, journal_id: journalId, user_id, user_name });
  } catch (err) {
    console.error('❌ Add journal member failed:', err);
    res.status(500).json({ error: 'Failed to add member' });
  } finally { if (conn) conn.release(); }
});

// ---- API: Anonymous Memory Exchange ----
app.post('/api/anonymous-memories', async (req, res) => {
  const { journey_id, user_id, title, story, location, travel_type, keywords } = req.body || {};
  if (!journey_id || !user_id || !title || !story) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO anonymous_memories (id, journey_id, original_user_id, title, story, location, travel_type, keywords, is_available, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
      [id, journey_id, user_id, title, story, location || '', travel_type || '', JSON.stringify(keywords || [])]
    );
    res.status(201).json({ id, title, location, travel_type });
  } catch (err) {
    console.error('❌ Create anonymous memory failed:', err);
    res.status(500).json({ error: 'Failed to create anonymous memory' });
  } finally { if (conn) conn.release(); }
});

app.get('/api/anonymous-memories', async (req, res) => {
  const travelType = req.query.travel_type?.toString();
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = 'SELECT id, title, story, location, travel_type, keywords, created_at FROM anonymous_memories WHERE is_available = TRUE';
    const params = [];
    if (travelType && travelType !== 'all') {
      sql += ' AND travel_type = ?';
      params.push(travelType);
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const rows = await conn.query(sql, params);
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      story: r.story,
      location: r.location || '',
      travel_type: r.travel_type || '',
      keywords: safeJson(r.keywords, []),
      created_at: r.created_at ? new Date(r.created_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List anonymous memories failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

app.post('/api/memory-exchanges', async (req, res) => {
  const { user1_id, user2_id, memory1_id, memory2_id } = req.body || {};
  if (!user1_id || !memory1_id || !memory2_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = crypto.randomUUID();
  const finalUser2 = user2_id || 'anonymous';
  let conn;
  try {
    conn = await pool.getConnection();
    // Mark both memories as unavailable
    await conn.query('UPDATE anonymous_memories SET is_available = FALSE WHERE id IN (?, ?)', [memory1_id, memory2_id]);
    await conn.query(
      `INSERT INTO memory_exchanges (id, user1_id, user2_id, memory1_id, memory2_id, exchanged_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, user1_id, finalUser2, memory1_id, memory2_id]
    );
    // Fetch the exchanged memories
    const memories = await conn.query(
      'SELECT id, title, story, location, travel_type FROM anonymous_memories WHERE id IN (?, ?)',
      [memory1_id, memory2_id]
    );
    res.status(201).json({
      id,
      exchanged_at: new Date().toISOString(),
      memories: memories.map(m => ({
        id: m.id,
        title: m.title,
        story: m.story,
        location: m.location,
        travel_type: m.travel_type
      }))
    });
  } catch (err) {
    console.error('❌ Create memory exchange failed:', err);
    res.status(500).json({ error: 'Failed to exchange memories' });
  } finally { if (conn) conn.release(); }
});

app.get('/api/memory-exchanges/:userId', async (req, res) => {
  const userId = req.params.userId;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM memory_exchanges WHERE user1_id = ? OR user2_id = ? ORDER BY exchanged_at DESC LIMIT 50',
      [userId, userId]
    );
    const exchanges = [];
    for (const r of rows) {
      const memories = await conn.query(
        'SELECT id, title, story, location FROM anonymous_memories WHERE id IN (?, ?)',
        [r.memory1_id, r.memory2_id]
      );
      exchanges.push({
        id: r.id,
        exchanged_at: r.exchanged_at ? new Date(r.exchanged_at).toISOString() : '',
        memories: memories.map(m => ({ id: m.id, title: m.title, story: m.story, location: m.location }))
      });
    }
    res.json(exchanges);
  } catch (err) {
    console.error('❌ Get memory exchanges failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

// ---- API: Friends/Contacts ----
app.post('/api/friends', async (req, res) => {
  const { user_id, friend_id, friend_name, friend_email, friend_avatar } = req.body || {};
  if (!user_id || !friend_id) return res.status(400).json({ error: 'Missing user_id or friend_id' });
  const id = crypto.randomUUID();
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO user_friends (id, user_id, friend_id, friend_name, friend_email, friend_avatar, status, added_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [id, user_id, friend_id, friend_name || '', friend_email || '', friend_avatar || '']
    );
    res.status(201).json({ id, user_id, friend_id, friend_name, friend_email, friend_avatar });
  } catch (err) {
    console.error('❌ Add friend failed:', err);
    res.status(500).json({ error: 'Failed to add friend' });
  } finally { if (conn) conn.release(); }
});

app.get('/api/friends', async (req, res) => {
  const userId = req.query.user_id?.toString();
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM user_friends WHERE user_id = ? AND status = "active" ORDER BY added_at DESC',
      [userId]
    );
    res.json(rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      friend_id: r.friend_id,
      friend_name: r.friend_name || '',
      friend_email: r.friend_email || '',
      friend_avatar: r.friend_avatar || '',
      status: r.status,
      added_at: r.added_at ? new Date(r.added_at).toISOString() : ''
    })));
  } catch (err) {
    console.error('❌ List friends failed:', err);
    res.status(500).json([]);
  } finally { if (conn) conn.release(); }
});

app.delete('/api/friends/:id', async (req, res) => {
  const id = req.params.id;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM user_friends WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('❌ Delete friend failed:', err);
    res.status(500).json({ error: 'Failed to delete friend' });
  } finally { if (conn) conn.release(); }
});

// ---- Memory Garden API ----
app.get('/api/garden/:userId', async (req, res) => {
  const userId = req.params.userId;
  let conn;
  try {
    conn = await pool.getConnection();
    const plants = await conn.query(
      'SELECT * FROM memory_garden_plants WHERE user_id = ? ORDER BY planted_at DESC',
      [userId]
    );
    res.json(plants.map(p => ({
      id: p.id,
      user_id: p.user_id,
      journey_id: p.journey_id,
      plant_type: p.plant_type,
      plant_name: p.plant_name,
      growth_stage: p.growth_stage,
      planted_at: p.planted_at,
      last_watered: p.last_watered,
      position_x: p.position_x,
      position_y: p.position_y,
      color: p.color
    })));
  } catch (err) {
    console.error('❌ Get garden failed:', err);
    res.status(500).json({ error: 'Failed to get garden' });
  } finally { if (conn) conn.release(); }
});

app.post('/api/garden/water/:plantId', async (req, res) => {
  const plantId = req.params.plantId;
  let conn;
  try {
    conn = await pool.getConnection();
    
    // Get current plant
    const plants = await conn.query('SELECT * FROM memory_garden_plants WHERE id = ?', [plantId]);
    if (plants.length === 0) return res.status(404).json({ error: 'Plant not found' });
    
    const plant = plants[0];
    const newStage = Math.min((plant.growth_stage || 1) + 1, 5);
    
    await conn.query(
      'UPDATE memory_garden_plants SET growth_stage = ?, last_watered = NOW() WHERE id = ?',
      [newStage, plantId]
    );
    
    res.json({ id: plantId, growth_stage: newStage, last_watered: new Date() });
  } catch (err) {
    console.error('❌ Water plant failed:', err);
    res.status(500).json({ error: 'Failed to water plant' });
  } finally { if (conn) conn.release(); }
});

app.listen(PORT, async () => {
  await initSchema();
  console.log(`✅ API server running at http://localhost:${PORT}`);
});
