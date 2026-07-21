"""Idempotent demo seeder (Python alternative to sql/02_seed.sql).

Assumes the schema already exists (apply sql/01_schema.sql first).
Run from the server/ directory:

    python -m scripts.seed
    # or
    python scripts/seed.py
"""
import os
import sys

# Allow running as a plain script (`python scripts/seed.py`) by ensuring the
# server/ directory (this file's parent's parent) is importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal  # noqa: E402
from app.core.levels import level_for_xp  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.crud import user as user_crud  # noqa: E402
from app.models.user import User  # noqa: E402

DEMO_USERS = [
    {"name": "Dr. V. Sukanya", "email": "teacher@questigo.dev", "password": "demo1234", "role": "TEACHER", "xp": 0},
    {"name": "Alice Chen", "email": "alice@student.dev", "password": "student123", "role": "STUDENT", "xp": 2300},
    {"name": "Bob Kumar", "email": "bob@student.dev", "password": "student123", "role": "STUDENT", "xp": 850},
]


def main() -> None:
    db = SessionLocal()
    created, skipped = 0, 0
    try:
        for entry in DEMO_USERS:
            if user_crud.get_by_email(db, entry["email"]):
                print(f"  skip   {entry['email']} (already exists)")
                skipped += 1
                continue
            user = User(
                name=entry["name"],
                email=entry["email"].lower(),
                password_hash=hash_password(entry["password"]),
                role=entry["role"],
                xp=entry["xp"],
                level=level_for_xp(entry["xp"]),
            )
            db.add(user)
            created += 1
            print(f"  create {entry['email']} ({entry['role']}, {entry['xp']} XP)")
        db.commit()
        print(f"\nDone. created={created} skipped={skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
