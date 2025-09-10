@echo off
cd /d "c:\Users\tashan\Documents\code\inspection mangment\backend"
echo Running base database seeding...
venv\Scripts\python.exe seed_database.py
echo.
echo Running extended database seeding...
venv\Scripts\python.exe seed_extended_data.py
echo.
echo Database seeding completed!
pause