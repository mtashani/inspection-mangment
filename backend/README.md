# Inspection Management System - Backend

## Overview
This is the backend service for the Inspection Management System. It provides APIs for managing equipment inspections, PSV calibration tracking, corrosion monitoring, and crane management.

## Recent Fixes

### Import Error Fixed (April 28, 2025)
- Fixed an issue with `get_risk_category` function being imported but not defined
- The problem affected `analytics_routes.py` which was importing this missing function
- Updated the import statements to remove the reference to the non-existent function
- Made the application more resilient to import errors with proper error handling and logging

### Database Reset and Seeding (April 20, 2025)
- Added reliable database reset functionality with `reset_db.py`
- Created seed scripts for PSV data
- Added comprehensive fix and verification utilities

## Setup and Running

### Environment Setup
1. Create a virtual environment:
```
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Set up your `.env` file (copy from `.env.example`)

### Database Setup
1. Reset the database:
```
python reset_db.py
```

2. Seed the database with initial data:
```
python reset_and_seed_all.py
```

### Running the Application
Start the server with:
```
uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000

## API Documentation
Once the server is running, documentation is available at:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Troubleshooting

### Import Errors
If you encounter import errors related to circular imports or missing functions:
1. Check if all dependencies are installed
2. Make sure your virtual environment is activated
3. If errors persist, run:
```
python fix_imports_simple.py
```

### Database Errors
If you have database connection or schema issues:
1. Verify that your PostgreSQL server is running
2. Check your `.env` configuration 
3. Reset the database using `python reset_db.py`
4. Verify the schema using `python verify_db.py`