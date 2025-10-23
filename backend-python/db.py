import os
import asyncio
from typing import Optional

import aiomysql
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', '3306'))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'memory_of_journeys')

_pool: Optional[aiomysql.Pool] = None


async def get_pool() -> aiomysql.Pool:
    global _pool
    if _pool is None:
        _pool = await aiomysql.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
            minsize=1,
            maxsize=5,
            autocommit=True,
            charset='utf8mb4'
        )
    return _pool


async def init_schema():
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # albums
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS albums (
                  id CHAR(36) PRIMARY KEY,
                  user_id VARCHAR(64) NOT NULL,
                  title VARCHAR(500) NOT NULL,
                  description TEXT,
                  journey_id CHAR(36),
                  visibility VARCHAR(20) DEFAULT 'public',
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_albums_user (user_id),
                  INDEX idx_albums_journey (journey_id)
                ) ENGINE=InnoDB;
                """
            )
            # album_photos (drop and recreate to ensure schema is correct)
            await cur.execute("DROP TABLE IF EXISTS album_photos")
            await cur.execute(
                """
                CREATE TABLE album_photos (
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
                """
            )
            # album_pages
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS album_pages (
                  id CHAR(36) PRIMARY KEY,
                  album_id CHAR(36) NOT NULL,
                  page_number INT NOT NULL,
                  content TEXT,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  UNIQUE KEY uniq_album_page (album_id, page_number)
                ) ENGINE=InnoDB;
                """
            )
            # future_plans
            await cur.execute(
                """
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
                """
            )
            # journeys
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS journeys (
                  id CHAR(36) PRIMARY KEY,
                  user_id VARCHAR(64) NOT NULL,
                  title VARCHAR(500) NOT NULL,
                  description TEXT,
                  journey_type VARCHAR(50) DEFAULT 'solo',
                  departure_date DATE,
                  return_date DATE,
                  legs JSON NOT NULL,
                  keywords JSON,
                  ai_story TEXT,
                  similarity_score FLOAT DEFAULT 0,
                  rarity_score FLOAT DEFAULT 50,
                  cultural_insights JSON,
                  visibility VARCHAR(20) DEFAULT 'public',
                  likes_count INT DEFAULT 0,
                  views_count INT DEFAULT 0,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_journeys_user (user_id),
                  INDEX idx_journeys_visibility (visibility),
                  INDEX idx_journeys_type (journey_type),
                  INDEX idx_journeys_created (created_at DESC),
                  INDEX idx_journeys_likes (likes_count DESC)
                ) ENGINE=InnoDB;
                """
            )
            # journey_likes
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS journey_likes (
                  id CHAR(36) PRIMARY KEY,
                  journey_id CHAR(36) NOT NULL,
                  user_id VARCHAR(64) NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE KEY uniq_journey_user_like (journey_id, user_id),
                  INDEX idx_journey_likes_journey (journey_id),
                  INDEX idx_journey_likes_user (user_id)
                ) ENGINE=InnoDB;
                """
            )


async def close_pool():
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
