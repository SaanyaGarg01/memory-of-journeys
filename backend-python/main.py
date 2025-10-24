import uuid
import json
from datetime import date, datetime
from typing import List, Optional
import os
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure local imports work when running via module path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from db import get_pool, init_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_schema()
    yield
    # Shutdown (if needed)


app = FastAPI(title="Memory of Journeys API (FastAPI)", lifespan=lifespan)

# If frontend runs via Vite proxy to same origin, CORS may be unnecessary. Keep permissive for dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Models ----------
class AlbumCreateBody(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = ""
    journey_id: Optional[str] = None
    visibility: str = "public"


class AlbumUpdateBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    journey_id: Optional[str] = None
    visibility: Optional[str] = None


class CreatePhotoBody(BaseModel):
    user_id: str
    image_url: str
    caption: Optional[str] = ""
    page_number: Optional[int] = 1
    meta: Optional[str] = None


class UpdatePhotoBody(BaseModel):
    caption: Optional[str] = None
    page_number: Optional[int] = None
    meta: Optional[str] = None


class PageUpsertBody(BaseModel):
    album_id: Optional[str] = None
    page_number: Optional[int] = None
    content: str


class PlanCreateBody(BaseModel):
    user_id: str
    destination: str
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None
    reason: Optional[str] = ""
    notes: Optional[str] = ""


class PlanUpdateBody(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class JourneyCreateBody(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = ""
    journey_type: str = "solo"
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    legs: List[dict] = []
    keywords: List[str] = []
    ai_story: Optional[str] = ""
    similarity_score: Optional[float] = 0.0
    rarity_score: Optional[float] = 50.0
    cultural_insights: Optional[dict] = {}
    visibility: str = "public"


class JourneyUpdateBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    journey_type: Optional[str] = None
    departure_date: Optional[str] = None
    return_date: Optional[str] = None
    legs: Optional[List[dict]] = None
    keywords: Optional[List[str]] = None
    ai_story: Optional[str] = None
    similarity_score: Optional[float] = None
    rarity_score: Optional[float] = None
    cultural_insights: Optional[dict] = None
    visibility: Optional[str] = None


# ---------- Helpers ----------
def to_iso_date(d: Optional[date]) -> str:
    return d.isoformat() if isinstance(d, (date, datetime)) else (d or "")


# ---------- Albums ----------
@app.get("/api/albums")
async def list_albums(user_id: str = Query(...)):
    """List all albums for a specific user"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, title, description, journey_id, visibility, created_at, updated_at FROM albums WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            rows = await cur.fetchall()
            albums = []
            for r in rows:
                albums.append({
                    "id": r[0],
                    "user_id": r[1],
                    "title": r[2],
                    "description": r[3] or "",
                    "journey_id": r[4],
                    "visibility": r[5],
                    "created_at": r[6].isoformat() if r[6] else "",
                    "updated_at": r[7].isoformat() if r[7] else "",
                })
            return albums


@app.post("/api/albums", status_code=201)
async def create_album(body: AlbumCreateBody):
    """Create a new photo album"""
    if not body.user_id or not body.title:
        raise HTTPException(status_code=400, detail="Missing user_id or title")
    
    album_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO albums (id, user_id, title, description, journey_id, visibility, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """,
                (
                    album_id,
                    body.user_id,
                    body.title,
                    body.description or "",
                    body.journey_id,
                    body.visibility,
                ),
            )
            return {
                "id": album_id,
                "user_id": body.user_id,
                "title": body.title,
                "description": body.description or "",
                "journey_id": body.journey_id,
                "visibility": body.visibility,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }


@app.get("/api/albums/{album_id}")
async def get_album(album_id: str):
    """Get a single album by ID"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, title, description, journey_id, visibility, created_at, updated_at FROM albums WHERE id = %s",
                (album_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Album not found")
            
            return {
                "id": row[0],
                "user_id": row[1],
                "title": row[2],
                "description": row[3] or "",
                "journey_id": row[4],
                "visibility": row[5],
                "created_at": row[6].isoformat() if row[6] else "",
                "updated_at": row[7].isoformat() if row[7] else "",
            }


@app.put("/api/albums/{album_id}")
async def update_album(album_id: str, body: AlbumUpdateBody):
    """Update an existing album"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Build dynamic update
            fields = []
            values = []
            
            if body.title is not None:
                fields.append("title = %s")
                values.append(body.title)
            if body.description is not None:
                fields.append("description = %s")
                values.append(body.description)
            if body.journey_id is not None:
                fields.append("journey_id = %s")
                values.append(body.journey_id)
            if body.visibility is not None:
                fields.append("visibility = %s")
                values.append(body.visibility)
            
            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            fields.append("updated_at = NOW()")
            values.append(album_id)
            
            sql = f"UPDATE albums SET {', '.join(fields)} WHERE id = %s"
            await cur.execute(sql, tuple(values))
            
            # Return updated album
            await cur.execute(
                "SELECT id, user_id, title, description, journey_id, visibility, created_at, updated_at FROM albums WHERE id = %s",
                (album_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Album not found")
            
            return {
                "id": row[0],
                "user_id": row[1],
                "title": row[2],
                "description": row[3] or "",
                "journey_id": row[4],
                "visibility": row[5],
                "created_at": row[6].isoformat() if row[6] else "",
                "updated_at": row[7].isoformat() if row[7] else "",
            }


@app.delete("/api/albums/{album_id}", status_code=204)
async def delete_album(album_id: str):
    """Delete an album and all its photos and pages"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Delete photos first
            await cur.execute("DELETE FROM album_photos WHERE album_id = %s", (album_id,))
            # Delete pages
            await cur.execute("DELETE FROM album_pages WHERE album_id = %s", (album_id,))
            # Delete album
            await cur.execute("DELETE FROM albums WHERE id = %s", (album_id,))
            return None


# ---------- Album Photos ----------
@app.get("/api/albums/{album_id}/photos")
async def list_photos(album_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, album_id, user_id, image_url, caption, page_number, meta, created_at FROM album_photos WHERE album_id = %s ORDER BY created_at DESC",
                (album_id,),
            )
            rows = await cur.fetchall()
            cols = [c[0] for c in cur.description]
            data = [dict(zip(cols, r)) for r in rows]
            return data


@app.post("/api/albums/{album_id}/photos", status_code=201)
async def create_photo(album_id: str, body: CreatePhotoBody):
    try:
        if not body.image_url or not body.user_id:
            raise HTTPException(status_code=400, detail="Missing image_url or user_id")
        
        pid = str(uuid.uuid4())
        pool = await get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                # Log the insert attempt
                print(f"📸 Inserting photo: album_id={album_id}, user_id={body.user_id}")
                
                await cur.execute(
                    """
                    INSERT INTO album_photos (id, album_id, user_id, image_url, caption, page_number, meta, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        pid,
                        album_id,
                        body.user_id,
                        body.image_url,
                        body.caption or "",
                        int(body.page_number or 1),
                        body.meta or None,
                    ),
                )
                
                print(f"✅ Photo saved successfully: {pid}")
                return {"id": pid, "album_id": album_id, **body.model_dump()}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving photo: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/api/albums/{album_id}/photos/{photo_id}")
async def update_photo(album_id: str, photo_id: str, body: UpdatePhotoBody):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Build dynamic update
            fields = []
            values = []
            if body.caption is not None:
                fields.append("caption=%s")
                values.append(body.caption)
            if body.page_number is not None:
                fields.append("page_number=%s")
                values.append(int(body.page_number))
            if body.meta is not None:
                fields.append("meta=%s")
                values.append(body.meta)
            if not fields:
                return {"ok": True}
            values.extend([photo_id, album_id])
            sql = f"UPDATE album_photos SET {', '.join(fields)} WHERE id = %s AND album_id = %s"
            await cur.execute(sql, tuple(values))
            return {"ok": True}


@app.delete("/api/albums/{album_id}/photos/{photo_id}", status_code=204)
async def delete_photo(album_id: str, photo_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM album_photos WHERE id = %s AND album_id = %s",
                (photo_id, album_id),
            )
            return None


# ---------- Album Pages ----------
@app.get("/api/albums/{album_id}/pages")
async def list_pages(album_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT page_number, content FROM album_pages WHERE album_id = %s ORDER BY page_number ASC",
                (album_id,),
            )
            rows = await cur.fetchall()
            return [
                {"page_number": r[0], "content": r[1] or ""}
                for r in rows
            ]


@app.put("/api/albums/{album_id}/pages/{page_number}")
async def update_page(album_id: str, page_number: int = Path(..., ge=1), body: PageUpsertBody = ...):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE album_pages SET content = %s WHERE album_id = %s AND page_number = %s",
                (body.content, album_id, page_number),
            )
            if cur.rowcount == 0:
                await cur.execute(
                    "INSERT INTO album_pages (id, album_id, page_number, content, updated_at) VALUES (%s, %s, %s, %s, NOW())",
                    (str(uuid.uuid4()), album_id, page_number, body.content),
                )
            return {"ok": True}


@app.post("/api/albums/{album_id}/pages")
async def upsert_page(album_id: str, body: PageUpsertBody):
    if body.page_number is None:
        raise HTTPException(status_code=400, detail="Missing page_number")
    page_number = int(body.page_number)
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Try update, else insert
            await cur.execute(
                "UPDATE album_pages SET content = %s WHERE album_id = %s AND page_number = %s",
                (body.content, album_id, page_number),
            )
            if cur.rowcount == 0:
                await cur.execute(
                    "INSERT INTO album_pages (id, album_id, page_number, content, updated_at) VALUES (%s, %s, %s, %s, NOW())",
                    (str(uuid.uuid4()), album_id, page_number, body.content),
                )
            return {"ok": True}


# ---------- Future Plans ----------
@app.get("/api/users/{user_id}/plans")
async def list_plans(user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, destination, start_date, end_date, reason, notes, created_at, updated_at FROM future_plans WHERE user_id = %s ORDER BY created_at DESC LIMIT 200",
                (user_id,),
            )
            rows = await cur.fetchall()
            plans = []
            for r in rows:
                plans.append({
                    "id": r[0],
                    "user_id": r[1],
                    "destination": r[2],
                    "start_date": to_iso_date(r[3])[:10] if r[3] else "",
                    "end_date": to_iso_date(r[4])[:10] if r[4] else "",
                    "reason": r[5] or "",
                    "notes": r[6] or "",
                    "created_at": r[7].isoformat() if r[7] else "",
                    "updated_at": r[8].isoformat() if r[8] else "",
                })
            return plans


@app.post("/api/plans", status_code=201)
async def create_plan(body: PlanCreateBody):
    if not body.user_id or not body.destination:
        raise HTTPException(status_code=400, detail="Missing user_id or destination")
    pid = str(uuid.uuid4())
    sd = body.start_date if body.start_date else None
    ed = body.end_date if body.end_date else None
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO future_plans (id, user_id, destination, start_date, end_date, reason, notes, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """,
                (pid, body.user_id, body.destination, sd, ed, body.reason or "", body.notes or ""),
            )
            return {"id": pid, **body.model_dump()}


@app.put("/api/plans/{plan_id}")
async def update_plan(plan_id: str, body: PlanUpdateBody):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                UPDATE future_plans
                SET destination = COALESCE(%s, destination),
                    start_date = COALESCE(%s, start_date),
                    end_date = COALESCE(%s, end_date),
                    reason = COALESCE(%s, reason),
                    notes = COALESCE(%s, notes),
                    updated_at = NOW()
                WHERE id = %s
                """,
                (
                    body.destination,
                    body.start_date,
                    body.end_date,
                    body.reason,
                    body.notes,
                    plan_id,
                ),
            )
            # Return updated row
            await cur.execute(
                "SELECT id, user_id, destination, start_date, end_date, reason, notes, created_at, updated_at FROM future_plans WHERE id = %s LIMIT 1",
                (plan_id,),
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Not found")
            return {
                "id": row[0],
                "user_id": row[1],
                "destination": row[2],
                "start_date": to_iso_date(row[3])[:10] if row[3] else "",
                "end_date": to_iso_date(row[4])[:10] if row[4] else "",
                "reason": row[5] or "",
                "notes": row[6] or "",
                "created_at": row[7].isoformat() if row[7] else "",
                "updated_at": row[8].isoformat() if row[8] else "",
            }


@app.delete("/api/plans/{plan_id}", status_code=204)
async def delete_plan(plan_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM future_plans WHERE id = %s", (plan_id,))
            return None


# ---------- Journeys ----------
@app.get("/api/journeys")
async def list_journeys(
    visibility: str = Query("public"),
    journey_type: Optional[str] = Query(None),
    limit: int = Query(20)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            query = "SELECT id, user_id, title, description, journey_type, departure_date, return_date, legs, keywords, ai_story, similarity_score, rarity_score, cultural_insights, visibility, likes_count, views_count, created_at, updated_at FROM journeys WHERE visibility = %s"
            params = [visibility]
            
            if journey_type and journey_type != 'all':
                query += " AND journey_type = %s"
                params.append(journey_type)
            
            query += " ORDER BY created_at DESC LIMIT %s"
            params.append(limit)
            
            await cur.execute(query, tuple(params))
            rows = await cur.fetchall()
            
            journeys = []
            for r in rows:
                journeys.append({
                    "id": r[0],
                    "user_id": r[1],
                    "title": r[2],
                    "description": r[3] or "",
                    "journey_type": r[4],
                    "departure_date": to_iso_date(r[5]),
                    "return_date": to_iso_date(r[6]),
                    "legs": json.loads(r[7]) if r[7] else [],
                    "keywords": json.loads(r[8]) if r[8] else [],
                    "ai_story": r[9] or "",
                    "similarity_score": float(r[10]) if r[10] else 0.0,
                    "rarity_score": float(r[11]) if r[11] else 50.0,
                    "cultural_insights": json.loads(r[12]) if r[12] else {},
                    "visibility": r[13],
                    "likes_count": r[14] or 0,
                    "views_count": r[15] or 0,
                    "created_at": r[16].isoformat() if r[16] else "",
                    "updated_at": r[17].isoformat() if r[17] else "",
                })
            return journeys


@app.get("/api/users/{user_id}/journeys")
async def get_user_journeys(user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, title, description, journey_type, departure_date, return_date, legs, keywords, ai_story, similarity_score, rarity_score, cultural_insights, visibility, likes_count, views_count, created_at, updated_at FROM journeys WHERE user_id = %s ORDER BY created_at DESC LIMIT 100",
                (user_id,)
            )
            rows = await cur.fetchall()
            
            journeys = []
            for r in rows:
                journeys.append({
                    "id": r[0],
                    "user_id": r[1],
                    "title": r[2],
                    "description": r[3] or "",
                    "journey_type": r[4],
                    "departure_date": to_iso_date(r[5]),
                    "return_date": to_iso_date(r[6]),
                    "legs": json.loads(r[7]) if r[7] else [],
                    "keywords": json.loads(r[8]) if r[8] else [],
                    "ai_story": r[9] or "",
                    "similarity_score": float(r[10]) if r[10] else 0.0,
                    "rarity_score": float(r[11]) if r[11] else 50.0,
                    "cultural_insights": json.loads(r[12]) if r[12] else {},
                    "visibility": r[13],
                    "likes_count": r[14] or 0,
                    "views_count": r[15] or 0,
                    "created_at": r[16].isoformat() if r[16] else "",
                    "updated_at": r[17].isoformat() if r[17] else "",
                })
            return journeys


@app.post("/api/journeys", status_code=201)
async def create_journey(body: JourneyCreateBody):
    if not body.user_id or not body.title:
        raise HTTPException(status_code=400, detail="Missing user_id or title")
    
    journey_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO journeys (
                    id, user_id, title, description, journey_type, 
                    departure_date, return_date, legs, keywords, ai_story, 
                    similarity_score, rarity_score, cultural_insights, visibility, 
                    likes_count, views_count, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """,
                (
                    journey_id,
                    body.user_id,
                    body.title,
                    body.description or "",
                    body.journey_type,
                    body.departure_date,
                    body.return_date,
                    json.dumps(body.legs),
                    json.dumps(body.keywords),
                    body.ai_story or "",
                    body.similarity_score,
                    body.rarity_score,
                    json.dumps(body.cultural_insights or {}),
                    body.visibility,
                    0,  # likes_count
                    0,  # views_count
                ),
            )
            
            # Return the created journey
            return {
                "id": journey_id,
                "user_id": body.user_id,
                "title": body.title,
                "description": body.description or "",
                "journey_type": body.journey_type,
                "departure_date": body.departure_date or "",
                "return_date": body.return_date or "",
                "legs": body.legs,
                "keywords": body.keywords,
                "ai_story": body.ai_story or "",
                "similarity_score": body.similarity_score,
                "rarity_score": body.rarity_score,
                "cultural_insights": body.cultural_insights or {},
                "visibility": body.visibility,
                "likes_count": 0,
                "views_count": 0,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }


@app.get("/api/journeys/{journey_id}")
async def get_journey(journey_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Increment views_count
            await cur.execute(
                "UPDATE journeys SET views_count = views_count + 1 WHERE id = %s",
                (journey_id,)
            )
            
            await cur.execute(
                "SELECT id, user_id, title, description, journey_type, departure_date, return_date, legs, keywords, ai_story, similarity_score, rarity_score, cultural_insights, visibility, likes_count, views_count, created_at, updated_at FROM journeys WHERE id = %s",
                (journey_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Journey not found")
            
            return {
                "id": row[0],
                "user_id": row[1],
                "title": row[2],
                "description": row[3] or "",
                "journey_type": row[4],
                "departure_date": to_iso_date(row[5]),
                "return_date": to_iso_date(row[6]),
                "legs": json.loads(row[7]) if row[7] else [],
                "keywords": json.loads(row[8]) if row[8] else [],
                "ai_story": row[9] or "",
                "similarity_score": float(row[10]) if row[10] else 0.0,
                "rarity_score": float(row[11]) if row[11] else 50.0,
                "cultural_insights": json.loads(row[12]) if row[12] else {},
                "visibility": row[13],
                "likes_count": row[14] or 0,
                "views_count": row[15] or 0,
                "created_at": row[16].isoformat() if row[16] else "",
                "updated_at": row[17].isoformat() if row[17] else "",
            }


@app.put("/api/journeys/{journey_id}")
async def update_journey(journey_id: str, body: JourneyUpdateBody):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Build dynamic update
            fields = []
            values = []
            
            if body.title is not None:
                fields.append("title = %s")
                values.append(body.title)
            if body.description is not None:
                fields.append("description = %s")
                values.append(body.description)
            if body.journey_type is not None:
                fields.append("journey_type = %s")
                values.append(body.journey_type)
            if body.departure_date is not None:
                fields.append("departure_date = %s")
                values.append(body.departure_date)
            if body.return_date is not None:
                fields.append("return_date = %s")
                values.append(body.return_date)
            if body.legs is not None:
                fields.append("legs = %s")
                values.append(json.dumps(body.legs))
            if body.keywords is not None:
                fields.append("keywords = %s")
                values.append(json.dumps(body.keywords))
            if body.ai_story is not None:
                fields.append("ai_story = %s")
                values.append(body.ai_story)
            if body.similarity_score is not None:
                fields.append("similarity_score = %s")
                values.append(body.similarity_score)
            if body.rarity_score is not None:
                fields.append("rarity_score = %s")
                values.append(body.rarity_score)
            if body.cultural_insights is not None:
                fields.append("cultural_insights = %s")
                values.append(json.dumps(body.cultural_insights))
            if body.visibility is not None:
                fields.append("visibility = %s")
                values.append(body.visibility)
            
            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")
            
            fields.append("updated_at = NOW()")
            values.append(journey_id)
            
            sql = f"UPDATE journeys SET {', '.join(fields)} WHERE id = %s"
            await cur.execute(sql, tuple(values))
            
            # Return updated journey
            await cur.execute(
                "SELECT id, user_id, title, description, journey_type, departure_date, return_date, legs, keywords, ai_story, similarity_score, rarity_score, cultural_insights, visibility, likes_count, views_count, created_at, updated_at FROM journeys WHERE id = %s",
                (journey_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Journey not found")
            
            return {
                "id": row[0],
                "user_id": row[1],
                "title": row[2],
                "description": row[3] or "",
                "journey_type": row[4],
                "departure_date": to_iso_date(row[5]),
                "return_date": to_iso_date(row[6]),
                "legs": json.loads(row[7]) if row[7] else [],
                "keywords": json.loads(row[8]) if row[8] else [],
                "ai_story": row[9] or "",
                "similarity_score": float(row[10]) if row[10] else 0.0,
                "rarity_score": float(row[11]) if row[11] else 50.0,
                "cultural_insights": json.loads(row[12]) if row[12] else {},
                "visibility": row[13],
                "likes_count": row[14] or 0,
                "views_count": row[15] or 0,
                "created_at": row[16].isoformat() if row[16] else "",
                "updated_at": row[17].isoformat() if row[17] else "",
            }


@app.delete("/api/journeys/{journey_id}", status_code=204)
async def delete_journey(journey_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Delete likes first
            await cur.execute("DELETE FROM journey_likes WHERE journey_id = %s", (journey_id,))
            # Delete journey
            await cur.execute("DELETE FROM journeys WHERE id = %s", (journey_id,))
            return None


@app.post("/api/journeys/{journey_id}/like")
async def like_journey(journey_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # For now, just increment the counter (we can add user tracking later)
            await cur.execute(
                "UPDATE journeys SET likes_count = likes_count + 1 WHERE id = %s",
                (journey_id,)
            )
            
            # Get updated likes_count
            await cur.execute(
                "SELECT likes_count FROM journeys WHERE id = %s",
                (journey_id,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Journey not found")
            
            return {"likes_count": row[0] or 0}


# ---------- Social Features Models ----------
class MemoryCircleCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    owner_id: str

class CircleMemberAdd(BaseModel):
    user_id: str

class CircleJourneyShare(BaseModel):
    journey_id: str
    shared_by: str

class CollaborativeJournalCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    created_by: str
    members: List[dict] = []

class JournalEntryCreate(BaseModel):
    user_id: str
    user_name: str
    content: str
    entry_type: str = "text"
    image_url: Optional[str] = None
    location: Optional[str] = None

class JournalMemberAdd(BaseModel):
    user_id: str
    user_name: Optional[str] = None

class AnonymousMemoryCreate(BaseModel):
    journey_id: str
    user_id: str
    title: str
    story: str
    location: Optional[str] = ""
    travel_type: Optional[str] = "solo"
    keywords: List[str] = []

class MemoryExchangeCreate(BaseModel):
    user1_id: str
    user2_id: str
    memory1_id: str
    memory2_id: str

class FriendCreate(BaseModel):
    user_id: str
    friend_id: str
    friend_name: Optional[str] = ""
    friend_email: Optional[str] = ""
    friend_avatar: Optional[str] = ""


# ---------- Memory Circles ----------
@app.post("/api/memory-circles", status_code=201)
async def create_memory_circle(body: MemoryCircleCreate):
    if not body.name or not body.owner_id:
        raise HTTPException(status_code=400, detail="Missing name or owner_id")
    
    circle_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO memory_circles (id, name, description, owner_id, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, NOW(), NOW())""",
                (circle_id, body.name, body.description or "", body.owner_id)
            )
            # Auto-add owner as admin
            await cur.execute(
                """INSERT INTO memory_circle_members (id, circle_id, user_id, role, joined_at)
                   VALUES (%s, %s, %s, 'admin', NOW())""",
                (member_id, circle_id, body.owner_id)
            )
            return {
                "id": circle_id,
                "name": body.name,
                "description": body.description or "",
                "owner_id": body.owner_id
            }


@app.get("/api/memory-circles")
async def list_memory_circles(user_id: Optional[str] = Query(None)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if user_id:
                await cur.execute(
                    """SELECT mc.*, mcm.role FROM memory_circles mc
                       INNER JOIN memory_circle_members mcm ON mc.id = mcm.circle_id
                       WHERE mcm.user_id = %s ORDER BY mc.created_at DESC""",
                    (user_id,)
                )
            else:
                await cur.execute("SELECT *, 'member' as role FROM memory_circles ORDER BY created_at DESC LIMIT 50")
            
            rows = await cur.fetchall()
            circles = []
            for r in rows:
                circles.append({
                    "id": r[0],
                    "name": r[1],
                    "description": r[2] or "",
                    "owner_id": r[3],
                    "role": r[6] if len(r) > 6 else "member",
                    "created_at": r[4].isoformat() if r[4] else ""
                })
            return circles


@app.get("/api/memory-circles/{circle_id}")
async def get_memory_circle(circle_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM memory_circles WHERE id = %s LIMIT 1", (circle_id,))
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Circle not found")
            
            # Get members
            await cur.execute("SELECT * FROM memory_circle_members WHERE circle_id = %s", (circle_id,))
            members = await cur.fetchall()
            
            # Get journeys
            await cur.execute(
                """SELECT j.*, mcj.shared_by FROM journeys j
                   INNER JOIN memory_circle_journeys mcj ON j.id = mcj.journey_id
                   WHERE mcj.circle_id = %s ORDER BY mcj.shared_at DESC""",
                (circle_id,)
            )
            journeys = await cur.fetchall()
            
            return {
                "id": row[0],
                "name": row[1],
                "description": row[2] or "",
                "owner_id": row[3],
                "created_at": row[4].isoformat() if row[4] else "",
                "members": [{"user_id": m[2], "role": m[3]} for m in members],
                "journeys": [{"id": j[0], "title": j[2], "shared_by": j[18]} for j in journeys] if journeys else []
            }


@app.post("/api/memory-circles/{circle_id}/members", status_code=201)
async def add_circle_member(circle_id: str, body: CircleMemberAdd):
    if not body.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    member_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO memory_circle_members (id, circle_id, user_id, role, joined_at)
                   VALUES (%s, %s, %s, 'member', NOW())""",
                (member_id, circle_id, body.user_id)
            )
            return {"id": member_id, "circle_id": circle_id, "user_id": body.user_id}


@app.post("/api/memory-circles/{circle_id}/journeys", status_code=201)
async def share_journey_to_circle(circle_id: str, body: CircleJourneyShare):
    if not body.journey_id or not body.shared_by:
        raise HTTPException(status_code=400, detail="Missing journey_id or shared_by")
    
    share_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO memory_circle_journeys (id, circle_id, journey_id, shared_by, shared_at)
                   VALUES (%s, %s, %s, %s, NOW())""",
                (share_id, circle_id, body.journey_id, body.shared_by)
            )
            return {"id": share_id, "circle_id": circle_id, "journey_id": body.journey_id}


# ---------- Collaborative Journals ----------
@app.post("/api/collaborative-journals", status_code=201)
async def create_collaborative_journal(body: CollaborativeJournalCreate):
    if not body.title or not body.created_by:
        raise HTTPException(status_code=400, detail="Missing title or created_by")
    
    journal_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO collaborative_journals (id, title, description, created_by, created_at, updated_at)
                   VALUES (%s, %s, %s, %s, NOW(), NOW())""",
                (journal_id, body.title, body.description or "", body.created_by)
            )
            # Auto-add creator as admin
            await cur.execute(
                """INSERT INTO collaborative_journal_members (id, journal_id, user_id, user_name, role, joined_at)
                   VALUES (%s, %s, %s, %s, 'admin', NOW())""",
                (member_id, journal_id, body.created_by, "Creator")
            )
            return {
                "id": journal_id,
                "title": body.title,
                "description": body.description or "",
                "created_by": body.created_by
            }


@app.get("/api/collaborative-journals")
async def list_collaborative_journals(user_id: Optional[str] = Query(None)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if user_id:
                await cur.execute(
                    """SELECT cj.*, cjm.role FROM collaborative_journals cj
                       INNER JOIN collaborative_journal_members cjm ON cj.id = cjm.journal_id
                       WHERE cjm.user_id = %s ORDER BY cj.created_at DESC""",
                    (user_id,)
                )
            else:
                await cur.execute("SELECT *, 'member' as role FROM collaborative_journals ORDER BY created_at DESC LIMIT 50")
            
            rows = await cur.fetchall()
            journals = []
            for r in rows:
                journals.append({
                    "id": r[0],
                    "title": r[1],
                    "description": r[2] or "",
                    "created_by": r[3],
                    "role": r[6] if len(r) > 6 else "member",
                    "created_at": r[4].isoformat() if r[4] else "",
                    "updated_at": r[5].isoformat() if r[5] else ""
                })
            return journals


@app.get("/api/collaborative-journals/{journal_id}")
async def get_collaborative_journal(journal_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT * FROM collaborative_journals WHERE id = %s LIMIT 1", (journal_id,))
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Journal not found")
            
            # Get members
            await cur.execute("SELECT * FROM collaborative_journal_members WHERE journal_id = %s", (journal_id,))
            members = await cur.fetchall()
            
            # Get entries
            await cur.execute(
                "SELECT * FROM collaborative_journal_entries WHERE journal_id = %s ORDER BY created_at DESC",
                (journal_id,)
            )
            entries = await cur.fetchall()
            
            return {
                "id": row[0],
                "title": row[1],
                "description": row[2] or "",
                "created_by": row[3],
                "created_at": row[4].isoformat() if row[4] else "",
                "updated_at": row[5].isoformat() if row[5] else "",
                "members": [{"user_id": m[2], "user_name": m[3] or "", "role": m[4]} for m in members],
                "entries": [{"id": e[0], "user_id": e[2], "user_name": e[3] or "", "content": e[4] or "", "entry_type": e[5], "image_url": e[6], "location": e[7], "created_at": e[8].isoformat() if e[8] else ""} for e in entries]
            }


@app.post("/api/collaborative-journals/{journal_id}/entries", status_code=201)
async def add_journal_entry(journal_id: str, body: JournalEntryCreate):
    if not body.user_id or not body.content:
        raise HTTPException(status_code=400, detail="Missing user_id or content")
    
    entry_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO collaborative_journal_entries (id, journal_id, user_id, user_name, content, entry_type, image_url, location, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
                (entry_id, journal_id, body.user_id, body.user_name, body.content, body.entry_type, body.image_url, body.location)
            )
            # Update journal timestamp
            await cur.execute("UPDATE collaborative_journals SET updated_at = NOW() WHERE id = %s", (journal_id,))
            return {"id": entry_id, "journal_id": journal_id}


@app.post("/api/collaborative-journals/{journal_id}/members", status_code=201)
async def add_journal_member(journal_id: str, body: JournalMemberAdd):
    if not body.user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    member_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO collaborative_journal_members (id, journal_id, user_id, user_name, role, joined_at)
                   VALUES (%s, %s, %s, %s, 'contributor', NOW())""",
                (member_id, journal_id, body.user_id, body.user_name or "")
            )
            return {"id": member_id, "journal_id": journal_id, "user_id": body.user_id}


# ---------- Anonymous Story Exchange ----------
@app.post("/api/anonymous-memories", status_code=201)
async def create_anonymous_memory(body: AnonymousMemoryCreate):
    if not body.journey_id or not body.user_id or not body.title or not body.story:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    memory_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO anonymous_memories (id, journey_id, original_user_id, title, story, location, travel_type, keywords, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
                (memory_id, body.journey_id, body.user_id, body.title, body.story, body.location or "", body.travel_type or "solo", json.dumps(body.keywords))
            )
            return {
                "id": memory_id,
                "title": body.title,
                "story": body.story,
                "location": body.location or "",
                "travel_type": body.travel_type or "solo"
            }


@app.get("/api/anonymous-memories")
async def list_anonymous_memories(travel_type: Optional[str] = Query(None)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if travel_type:
                await cur.execute(
                    "SELECT * FROM anonymous_memories WHERE travel_type = %s ORDER BY created_at DESC LIMIT 50",
                    (travel_type,)
                )
            else:
                await cur.execute("SELECT * FROM anonymous_memories ORDER BY created_at DESC LIMIT 50")
            
            rows = await cur.fetchall()
            memories = []
            for r in rows:
                memories.append({
                    "id": r[0],
                    "title": r[3],
                    "story": r[4] or "",
                    "location": r[5] or "",
                    "travel_type": r[6] or "solo",
                    "keywords": json.loads(r[7]) if r[7] else [],
                    "created_at": r[8].isoformat() if r[8] else ""
                })
            return memories


@app.post("/api/memory-exchanges", status_code=201)
async def create_memory_exchange(body: MemoryExchangeCreate):
    if not body.user1_id or not body.memory1_id or not body.memory2_id:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    exchange_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO memory_exchanges (id, user1_id, user2_id, memory1_id, memory2_id, exchanged_at)
                   VALUES (%s, %s, %s, %s, %s, NOW())""",
                (exchange_id, body.user1_id, body.user2_id, body.memory1_id, body.memory2_id)
            )
            
            # Get both memories
            await cur.execute(
                "SELECT * FROM anonymous_memories WHERE id IN (%s, %s)",
                (body.memory1_id, body.memory2_id)
            )
            memories = await cur.fetchall()
            
            return {
                "id": exchange_id,
                "exchanged_at": datetime.utcnow().isoformat(),
                "memories": [{"id": m[0], "title": m[3], "story": m[4] or "", "location": m[5] or ""} for m in memories]
            }


@app.get("/api/memory-exchanges/{user_id}")
async def get_user_exchanges(user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM memory_exchanges WHERE user1_id = %s OR user2_id = %s ORDER BY exchanged_at DESC",
                (user_id, user_id)
            )
            rows = await cur.fetchall()
            
            exchanges = []
            for r in rows:
                # Get memories for this exchange
                await cur.execute(
                    "SELECT * FROM anonymous_memories WHERE id IN (%s, %s)",
                    (r[3], r[4])
                )
                memories = await cur.fetchall()
                
                exchanges.append({
                    "id": r[0],
                    "exchanged_at": r[5].isoformat() if r[5] else "",
                    "memories": [{"id": m[0], "title": m[3], "story": m[4] or "", "location": m[5] or ""} for m in memories]
                })
            return exchanges


# ---------- Friends/Contacts ----------
@app.post("/api/friends", status_code=201)
async def add_friend(body: FriendCreate):
    if not body.user_id or not body.friend_id:
        raise HTTPException(status_code=400, detail="Missing user_id or friend_id")
    
    friend_id = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """INSERT INTO user_friends (id, user_id, friend_id, friend_name, friend_email, friend_avatar, status, added_at)
                   VALUES (%s, %s, %s, %s, %s, %s, 'active', NOW())""",
                (friend_id, body.user_id, body.friend_id, body.friend_name or "", body.friend_email or "", body.friend_avatar or "")
            )
            return {
                "id": friend_id,
                "user_id": body.user_id,
                "friend_id": body.friend_id,
                "friend_name": body.friend_name or "",
                "friend_email": body.friend_email or "",
                "friend_avatar": body.friend_avatar or ""
            }


@app.get("/api/friends")
async def list_friends(user_id: str = Query(...)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM user_friends WHERE user_id = %s AND status = 'active' ORDER BY added_at DESC",
                (user_id,)
            )
            rows = await cur.fetchall()
            
            friends = []
            for r in rows:
                friends.append({
                    "id": r[0],
                    "user_id": r[1],
                    "friend_id": r[2],
                    "friend_name": r[3] or "",
                    "friend_email": r[4] or "",
                    "friend_avatar": r[5] or "",
                    "status": r[6],
                    "added_at": r[7].isoformat() if r[7] else ""
                })
            return friends


@app.delete("/api/friends/{friend_id}", status_code=204)
async def delete_friend(friend_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM user_friends WHERE id = %s", (friend_id,))
            return None


# Healthcheck
@app.get("/api/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
