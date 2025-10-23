import uuid
from datetime import date, datetime
from typing import List, Optional
import os
import sys

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure local imports work when running via module path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from db import get_pool, init_schema

app = FastAPI(title="Memory of Journeys API (FastAPI)")

# If frontend runs via Vite proxy to same origin, CORS may be unnecessary. Keep permissive for dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_schema()


# ---------- Models ----------
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


# ---------- Helpers ----------
def to_iso_date(d: Optional[date]) -> str:
    return d.isoformat() if isinstance(d, (date, datetime)) else (d or "")


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
    if not body.image_url or not body.user_id:
        raise HTTPException(status_code=400, detail="Missing image_url or user_id")
    pid = str(uuid.uuid4())
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
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
            return {"id": pid, "album_id": album_id, **body.model_dump()}


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


# Healthcheck
@app.get("/api/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
