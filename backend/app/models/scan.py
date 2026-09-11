"""
PhishGuard SQLAlchemy ORM Model for Scan Records
"""

from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(Text, nullable=False)
    risk_score = Column(Integer, nullable=False)           # 0-100
    verdict = Column(String(20), nullable=False)           # Safe, Suspicious, Phishing
    confidence = Column(Float, nullable=False)             # 0.0-1.0
    features = Column(Text, nullable=False)                # JSON blob
    shap_values = Column(Text, nullable=False)             # JSON blob
    model_predictions = Column(Text, nullable=False)       # JSON blob
    top_reasons = Column(Text, nullable=False)             # JSON array
    best_model_name = Column(String(50), nullable=True)    # primary predictor name
    created_at = Column(DateTime, server_default=func.now())
