pip install sqlalchemy pydantic psycopg2-binary
from sqlalchemy import Column, Float, Boolean, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base # <-- Cập nhật chuẩn SQLAlchemy 2.0
import uuid

Base = declarative_base()

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    input_data = Column(JSONB, nullable=False)
    churn_score = Column(Float, nullable=False)
    will_churn = Column(Boolean, nullable=False)
    risk_level = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)