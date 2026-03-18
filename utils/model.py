from __future__ import annotations

from sqlalchemy import (
    Column,
    Float,
    Boolean,
    Text,
    TIMESTAMP,
    func,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import uuid
from datetime import datetime


# ====================== SQLAlchemy 2.0 Modern Style ======================
class Base(DeclarativeBase):
    """Base class cho tất cả model"""
    pass


class Application(Base):
    __tablename__ = "applications"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # Input data (toàn bộ 75+ features)
    input_data: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Prediction result
    churn_score: Mapped[float] = mapped_column(Float, nullable=False)
    will_churn: Mapped[bool] = mapped_column(Boolean, nullable=False)
    risk_level: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps (timezone-aware, server-side)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),   # ← quan trọng: server tự update
        nullable=False,
    )

    # Optional: giúp debug dễ hơn
    def __repr__(self) -> str:
        return f"<Application(id={self.id}, will_churn={self.will_churn}, risk={self.risk_level})>"