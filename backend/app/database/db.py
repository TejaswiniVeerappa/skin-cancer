from sqlalchemy import create_engine
from dotenv import load_dotenv
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_BASE = os.path.dirname(os.path.abspath(__file__))
_ENV_PATH = os.path.normpath(os.path.join(_BASE, "..", "..", ".env"))
load_dotenv(_ENV_PATH)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

try:
    connection = engine.connect()
    print("[OK] Database connected successfully!")
    connection.close()
except Exception as e:
    print("[FAIL] Database connection failed!")
    print(e)
