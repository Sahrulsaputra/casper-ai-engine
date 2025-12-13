# db/db_manager.py
import sqlite3
from pathlib import Path

DB_PATH = "itmind.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    with open("db/schema.sql") as f:
        conn.executescript(f.read())
    conn.close()

def create_user_if_not_exists(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("INSERT OR IGNORE INTO users (user_id) VALUES (?)", (user_id,))
    conn.commit()
    conn.close()

def log_device_info(user_id: str, device_info: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("INSERT INTO devices (user_id, device_info) VALUES (?, ?)", (user_id, device_info))
    conn.commit()
    conn.close()

def save_message(user_id: str, msg: str, is_user: bool):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("INSERT INTO chat_history (user_id, message, is_user) VALUES (?, ?, ?)",
                 (user_id, msg, is_user))
    conn.commit()
    conn.close()

def get_user_history(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute("""
        SELECT message, is_user, created_at
        FROM chat_history
        WHERE user_id = ?
        ORDER BY created_at
    """, (user_id,)).fetchall()
    conn.close()
    return [{"message": r[0], "is_user": bool(r[1]), "timestamp": r[2]} for r in rows]

def delete_user_data(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    conn.execute("DELETE FROM devices WHERE user_id = ?", (user_id,))
    # File di uploads/user_id/ dihapus manual (opsional)
    import shutil
    shutil.rmtree(f"uploads/{user_id}", ignore_errors=True)
    conn.commit()
    conn.close()
