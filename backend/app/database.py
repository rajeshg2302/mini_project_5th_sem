"""
PhishGuard Database Setup (SQLAlchemy + SQLite)
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and apply any pending schema migrations."""
    from .models import scan, case, audit_log, research  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # ── Schema migration: add best_model_name column if missing ──────────
    # SQLAlchemy create_all() does not ALTER existing tables, so we apply
    # the migration explicitly for databases created before Phase 3.
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("scans")]
        if "best_model_name" not in columns:
            conn.execute(text("ALTER TABLE scans ADD COLUMN best_model_name VARCHAR(50)"))
            conn.commit()

        if inspector.has_table("cases"):
            case_columns = [col["name"] for col in inspector.get_columns("cases")]
            if "assessment" not in case_columns:
                conn.execute(text("ALTER TABLE cases ADD COLUMN assessment TEXT"))
                conn.commit()
            if "resolution" not in case_columns:
                conn.execute(text("ALTER TABLE cases ADD COLUMN resolution VARCHAR(50)"))
                conn.commit()
            if "resolution_notes" not in case_columns:
                conn.execute(text("ALTER TABLE cases ADD COLUMN resolution_notes TEXT"))
                conn.commit()
