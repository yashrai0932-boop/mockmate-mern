import sqlite3
import os

db_path = "mockmate.db"

if not os.path.exists(db_path):
    print("No database found, nothing to migrate.")
    exit(0)

conn = sqlite3.connect(db_path)
c = conn.cursor()

print("Migrating interview_sessions table...")
try:
    c.execute("ALTER TABLE interview_sessions ADD COLUMN proctoring_enabled BOOLEAN DEFAULT 1")
    c.execute("ALTER TABLE interview_sessions ADD COLUMN integrity_score FLOAT DEFAULT 100.0")
    c.execute("ALTER TABLE interview_sessions ADD COLUMN proctor_warnings INTEGER DEFAULT 0")
    c.execute("ALTER TABLE interview_sessions ADD COLUMN proctor_summary JSON")
    print("interview_sessions migration successful.")
except Exception as e:
    print("interview_sessions error (may already exist):", e)

print("Migrating reports table...")
try:
    c.execute("ALTER TABLE reports ADD COLUMN integrity_score FLOAT")
    c.execute("ALTER TABLE reports ADD COLUMN proctoring_summary JSON")
    print("reports migration successful.")
except Exception as e:
    print("reports error (may already exist):", e)

conn.commit()
conn.close()
print("Migration completed.")
