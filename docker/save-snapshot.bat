@echo off
REM Overwrite the good snapshot with the CURRENT state of the running db container.
REM Run this when you've reached a new "known good" state you want to reset to later.
echo Saving current DB state as the new snapshot...
docker compose exec -T db pg_dump -U qdevdbusr -d questigo_dev --no-owner --no-privileges --clean --if-exists > docker\postgres\initdb\10_snapshot.sql
echo Saved to docker\postgres\initdb\10_snapshot.sql
