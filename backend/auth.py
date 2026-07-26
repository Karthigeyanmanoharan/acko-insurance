# backend/auth.py
# Handles signup, login, password hashing, and current-user identification.

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session


from database import get_db
from sql_table import User

# Router — groups all auth-related endpoints under /auth/...
router = APIRouter(prefix="/auth", tags=["Authentication"])

import bcrypt



# ---------------------------------------------------------------------------
# Pydantic schemas — define the JSON shapes for requests and responses.
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hash_password(plain: str) -> str:
    # Bcrypt has a 72-byte input limit. Truncate safely if needed.
    pwd_bytes = plain.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))



# A very simple "session token" approach for the capstone:
# After login, we return the user's id as a token. The frontend stores it
# in localStorage and sends it back in the `X-User-Id` header on each request.
# Good enough for a learning project; NOT production-grade.
def get_current_user(
    x_user_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user


def require_role(required_role: str):
    """Use as a dependency to gate endpoints to a specific role."""
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"This endpoint requires role '{required_role}'",
            )
        return user
    return checker


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Customer signup. Managers are NOT created here — they're inserted
    manually into the DB by an admin."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password=hash_password(payload.password),
        role="customer",  # signup is always for customers
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Login for both customers and managers. Returns the user's id as
    the session token plus their role for the frontend to redirect."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "token": user.id,       # simple token = user id
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Returns the currently logged-in user. Used by the frontend to verify
    a stored token is still valid on page load."""
    return current_user