"""
PhishGuard — Research Experiment SQLAlchemy Model
Phase 14: Model Research Lab
"""

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base


class ResearchExperiment(Base):
    """
    Stores reproducible ML research experiments.
    One record per evaluation run — never fabricated.
    """
    __tablename__ = "research_experiments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(20), unique=True, nullable=False)   # e.g. EXP-00021
    dataset_name = Column(String(100), nullable=False)
    dataset_mode = Column(String(20), nullable=False)                  # synthetic | real_world
    model_name = Column(String(50), nullable=False)                    # logistic_regression | all
    split = Column(String(20), nullable=True, default="80/20")
    random_seed = Column(Integer, nullable=True, default=42)
    metrics = Column(Text, nullable=True)                              # JSON blob of metric results
    timestamp = Column(DateTime, server_default=func.now())
    model_version = Column(String(30), nullable=True)
    dataset_version = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
