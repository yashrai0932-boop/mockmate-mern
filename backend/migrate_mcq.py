import sqlite3
import os

db_path = "mockmate.db"

if not os.path.exists(db_path):
    print("No database found, nothing to migrate.")
    exit(0)

conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Migrating questions table...")
try:
    c.execute("ALTER TABLE questions ADD COLUMN question_type VARCHAR(20) DEFAULT 'open_ended'")
    c.execute("ALTER TABLE questions ADD COLUMN options JSON")
    print("questions migration successful.")
except Exception as e:
    print("questions error (may already exist):", e)

conn.commit()
conn.close()
print("Migration completed.")
