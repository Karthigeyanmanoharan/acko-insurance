# backend/models.py
# SQLAlchemy table definitions for all 4 core tables.
# Schema matches the project document exactly.

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base


def new_uuid() -> str:
    """Generate a unique ID as a string. SQLite has no native UUID type,
    so we store UUIDs as strings."""
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# 1. users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id          = Column(String, primary_key=True, default=new_uuid)
    name        = Column(String(100), nullable=False)
    email       = Column(String(150), unique=True, nullable=False, index=True)
    phone       = Column(String(15))
    password    = Column(String(255), nullable=False)   # bcrypt hash, never plain
    role        = Column(String(20), nullable=False, default="customer")  # customer / manager
    created_at  = Column(DateTime, default=datetime.utcnow)

    # Backrefs (so we can do user.quotations, user.claims, user.chat_logs)
    quotations = relationship("Quotation", back_populates="user")
    claims     = relationship("Claim",     back_populates="user")
    chat_logs  = relationship("ChatLog",   back_populates="user")


# ---------------------------------------------------------------------------
# 2. quotations  (Module 2 — premium quote predictor)
# ---------------------------------------------------------------------------
class Quotation(Base):
    __tablename__ = "quotations"

    id                  = Column(String, primary_key=True, default=new_uuid)
    user_id             = Column(String, ForeignKey("users.id"), nullable=False)
    vehicle_type        = Column(String(10))    # car / bike
    vehicle_make        = Column(String(50))
    vehicle_model       = Column(String(80))
    manufacturing_year  = Column(Integer)
    city                = Column(String(80))
    idv                 = Column(Float)         # Insured Declared Value (₹)
    ncb_percent         = Column(Integer)       # No Claim Bonus %
    predicted_premium   = Column(Float)         # ML output (₹)
    created_at          = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quotations")


# ---------------------------------------------------------------------------
# 3. claims  (Module 3 — claim submissions + ML predictions)
# ---------------------------------------------------------------------------
class Claim(Base):
    __tablename__ = "claims"

    id                    = Column(String, primary_key=True, default=new_uuid)
    user_id               = Column(String, ForeignKey("users.id"), nullable=False)
    vehicle_type          = Column(String(10))     # car / bike
    policy_number         = Column(String(50))     # Gemini extracts from form
    incident_date         = Column(Date)
    damage_type           = Column(String(50))     # scratch / dent / crack / total loss
    affected_parts        = Column(String(200))    # comma-separated parts list
    damage_severity       = Column(String(20))     # minor / moderate / major
    image_s3_key          = Column(String(255))    # path to damage photo
    form_s3_key           = Column(String(255))    # path to claim form PDF
    predicted_amount      = Column(Float)          # ML predicted ₹ settlement
    approval_probability  = Column(Float)          # 0.0 to 1.0
    status                = Column(String(20), default="pending")  # pending/approved/rejected/review
    created_at            = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="claims")


# ---------------------------------------------------------------------------
# 4. chat_logs  (Module 1 — every Q&A goes here)
# ---------------------------------------------------------------------------
class ChatLog(Base):
    __tablename__ = "chat_logs"

    id               = Column(String, primary_key=True, default=new_uuid)
    user_id          = Column(String, ForeignKey("users.id"), nullable=False)
    intent           = Column(String(30))     # policy_qa / quotation / claims
    question         = Column(Text)
    retrieved_source = Column(String(255))    # which PDF chunk was used (RAG)
    response         = Column(Text)
    created_at       = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_logs")