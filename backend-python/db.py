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
            # memory_circles
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS memory_circles (
                  id CHAR(36) PRIMARY KEY,
                  name VARCHAR(255) NOT NULL,
                  description TEXT,
                  owner_id VARCHAR(64) NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_memory_circles_owner (owner_id)
                ) ENGINE=InnoDB;
                """
            )
            # memory_circle_members
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS memory_circle_members (
                  id CHAR(36) PRIMARY KEY,
                  circle_id CHAR(36) NOT NULL,
                  user_id VARCHAR(64) NOT NULL,
                  role VARCHAR(20) DEFAULT 'member',
                  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_mcm_circle (circle_id),
                  INDEX idx_mcm_user (user_id)
                ) ENGINE=InnoDB;
                """
            )
            # memory_circle_journeys
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS memory_circle_journeys (
                  id CHAR(36) PRIMARY KEY,
                  circle_id CHAR(36) NOT NULL,
                  journey_id CHAR(36) NOT NULL,
                  shared_by VARCHAR(64) NOT NULL,
                  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_mcj_circle (circle_id),
                  INDEX idx_mcj_journey (journey_id)
                ) ENGINE=InnoDB;
                """
            )
            # collaborative_journals
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS collaborative_journals (
                  id CHAR(36) PRIMARY KEY,
                  title VARCHAR(255) NOT NULL,
                  description TEXT,
                  created_by VARCHAR(64) NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  INDEX idx_cj_creator (created_by)
                ) ENGINE=InnoDB;
                """
            )
            # collaborative_journal_members
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS collaborative_journal_members (
                  id CHAR(36) PRIMARY KEY,
                  journal_id CHAR(36) NOT NULL,
                  user_id VARCHAR(64) NOT NULL,
                  user_name VARCHAR(255),
                  role VARCHAR(20) DEFAULT 'contributor',
                  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_cjm_journal (journal_id),
                  INDEX idx_cjm_user (user_id)
                ) ENGINE=InnoDB;
                """
            )
            # collaborative_journal_entries
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS collaborative_journal_entries (
                  id CHAR(36) PRIMARY KEY,
                  journal_id CHAR(36) NOT NULL,
                  user_id VARCHAR(64) NOT NULL,
                  user_name VARCHAR(255),
                  content TEXT NOT NULL,
                  entry_type VARCHAR(20) DEFAULT 'text',
                  image_url TEXT,
                  location VARCHAR(255),
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_cje_journal (journal_id),
                  INDEX idx_cje_user (user_id)
                ) ENGINE=InnoDB;
                """
            )
            # anonymous_memories
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS anonymous_memories (
                  id CHAR(36) PRIMARY KEY,
                  journey_id CHAR(36) NOT NULL,
                  original_user_id VARCHAR(64) NOT NULL,
                  title VARCHAR(255) NOT NULL,
                  story TEXT NOT NULL,
                  location VARCHAR(255),
                  travel_type VARCHAR(50),
                  keywords JSON,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_am_journey (journey_id),
                  INDEX idx_am_type (travel_type)
                ) ENGINE=InnoDB;
                """
            )
            # memory_exchanges
            await cur.execute(
                """
                CREATE TABLE IF NOT EXISTS memory_exchanges (
                  id CHAR(36) PRIMARY KEY,
                  user1_id VARCHAR(64) NOT NULL,
                  user2_id VARCHAR(64) NOT NULL,
                  memory1_id CHAR(36) NOT NULL,
                  memory2_id CHAR(36) NOT NULL,
                  exchanged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_me_user1 (user1_id),
                  INDEX idx_me_user2 (user2_id)
                ) ENGINE=InnoDB;
                """
            )
            # user_friends
            await cur.execute(
                """
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
                """
            )
            print("✅ All database tables created successfully!")


async def close_pool():
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
