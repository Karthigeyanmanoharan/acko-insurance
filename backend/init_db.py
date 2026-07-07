from database import Base, engine, DB_PATH
import models



print(f"📍 Database file path: {DB_PATH}")
print('Creating tables')
Base.metadata.create_all(bind=engine)
print("✅ Done. Tables created in acko.db:")

for table_name in Base.metadata.tables.keys():
    print(f"   - {table_name}")