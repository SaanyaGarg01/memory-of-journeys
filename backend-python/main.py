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


# Healthcheck
@app.get("/api/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
