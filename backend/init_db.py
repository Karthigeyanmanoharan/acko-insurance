# backend/init_db.py
from database import Base, engine
import sql_table  # registers all table classes

print("Creating tables in PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("✅ Done. Tables created:")
for table in Base.metadata.tables.keys():
    print(f"   - {table}")