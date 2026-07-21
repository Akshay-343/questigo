@echo off
REM Reset the database back to the good snapshot in docker/postgres/initdb.
REM Wipes the Postgres data volume, then recreates the stack (snapshot auto-loads).
echo Resetting Questigo DB to the saved snapshot...
docker compose down -v
docker compose up -d
echo Done. Open http://localhost:5173
