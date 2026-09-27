"""
Database connection and session management for PostgreSQL + PostGIS.
Resilient initialization: checks connectivity on startup without crashing if DB is offline.
"""
from __future__ import annotations
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

Base = declarative_base()

_engine = None
_SessionLocal = None
_db_available = False

try:
    _engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"connect_timeout": 3},
    )
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
except Exception as e:
    logger.warning(f"Database engine creation deferred: {e}")


def check_db_connection() -> bool:
    """Check if PostgreSQL + PostGIS is accessible."""
    global _db_available
    if _engine is None:
        _db_available = False
        return False

    try:
        with _engine.connect() as conn:
            # Check PostGIS extension
            result = conn.execute(text("SELECT PostGIS_Version();")).fetchone()
            if result:
                logger.info(f"PostGIS connected: {result[0]}")
                _db_available = True
                return True
    except Exception as e:
        logger.info(f"PostGIS database not available (running in file-backed mode): {e}")
        _db_available = False
        return False

    _db_available = False
    return False


def get_db():
    """Dependency injection helper for FastAPI routes."""
    if _SessionLocal is None or not _db_available:
        yield None
        return

    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_database_connected() -> bool:
    return _db_available
