import sqlite3
import os

# Connect to the database
db_path = r"c:\Users\tashan\Documents\code\inspection mangment\backend\inspection_management.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the schema for inspector_documents table
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='inspector_documents';")
schema = cursor.fetchone()

if schema:
    print("Inspector Documents Table Schema:")
    print(schema[0])
else:
    print("Table 'inspector_documents' not found")

# Check if original_filename column exists
cursor.execute("PRAGMA table_info(inspector_documents);")
columns = cursor.fetchall()
print("\nColumns in inspector_documents table:")
for column in columns:
    print(f"- {column[1]} ({column[2]})")

conn.close()