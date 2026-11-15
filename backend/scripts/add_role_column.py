#!/usr/bin/env python3
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment or .env")
    raise SystemExit(1)

engine = create_engine(DATABASE_URL)

alter_sql = "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'patient';"

with engine.connect() as conn:
    try:
        conn.execute(text(alter_sql))
        conn.commit()
        print("✅ Added 'role' column to users table.")
    except SQLAlchemyError as e:
        msg = str(e).lower()
        if "already exists" in msg or "duplicate" in msg or "column \"role\"" in msg:
            print("ℹ️ 'role' column already exists; no changes made.")
        else:
            print("❌ Failed to alter table:", e)
            raise
