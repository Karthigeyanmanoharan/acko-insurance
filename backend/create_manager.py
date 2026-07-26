# backend/create_manager.py
# One-time script to create a manager account.
# Run with: python create_manager.py

from database import SessionLocal
from sql_table import User
from auth import hash_password

MANAGER_NAME     = "Acko Manager"
MANAGER_EMAIL    = "manager@acko.com"
MANAGER_PASSWORD = "manager123"
MANAGER_PHONE    = "9000000000"

db = SessionLocal()

existing = db.query(User).filter(User.email == MANAGER_EMAIL).first()
if existing:
    print(f"⚠️  Manager already exists: {MANAGER_EMAIL}")
else:
    manager = User(
        name=MANAGER_NAME,
        email=MANAGER_EMAIL,
        phone=MANAGER_PHONE,
        password=hash_password(MANAGER_PASSWORD),
        role="manager",
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    print("✅ Manager created!")
    print(f"   Email:    {MANAGER_EMAIL}")
    print(f"   Password: {MANAGER_PASSWORD}")
    print(f"   ID:       {manager.id}")

db.close()