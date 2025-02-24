# Industrial Equipment Inspection Management Backend

This is the backend API for the Industrial Equipment Inspection Management system, built with FastAPI and PostgreSQL.

## Features

- Equipment management with risk assessment based on API 581
- Inspection tracking and scheduling
- Daily reports with multiple inspector support
- Risk calculation for inspection intervals
- PostgreSQL database with SQLModel ORM
- Alembic migrations for database versioning

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Poetry (recommended) or pip

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a PostgreSQL database:
```sql
CREATE DATABASE inspection_db;
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

5. Run database migrations:
```bash
alembic upgrade head
```

## Running the Application

Development mode:
```bash
uvicorn app.main:app --reload
```

Production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the application is running, you can access:
- Swagger UI documentation: http://localhost:8000/docs
- ReDoc documentation: http://localhost:8000/redoc

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/           # Migration versions
│   └── env.py             # Alembic environment configuration
├── app/
│   ├── routers/           # API route handlers
│   │   ├── equipment.py   # Equipment management endpoints
│   │   ├── inspections.py # Inspection management endpoints
│   │   ├── daily_reports.py # Daily report endpoints
│   │   └── inspectors.py  # Inspector management endpoints
│   ├── models.py          # SQLModel database models
│   ├── database.py        # Database configuration
│   └── main.py           # FastAPI application setup
├── requirements.txt       # Project dependencies
├── alembic.ini           # Alembic configuration
└── .env.example          # Example environment variables
```

## API Endpoints

### Equipment
- `GET /api/equipment` - List equipment with filters
- `POST /api/equipment` - Create new equipment
- `GET /api/equipment/{id}` - Get equipment details
- `PUT /api/equipment/{id}` - Update equipment
- `DELETE /api/equipment/{id}` - Delete equipment

### Inspections
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Create new inspection
- `GET /api/inspections/{id}` - Get inspection details
- `PUT /api/inspections/{id}` - Update inspection
- `POST /api/inspections/{id}/daily-reports` - Add daily report
- `GET /api/inspections/{id}/daily-reports` - List daily reports

### Daily Reports
- `GET /api/daily-reports/{id}` - Get daily report
- `PUT /api/daily-reports/{id}` - Update daily report
- `DELETE /api/daily-reports/{id}` - Delete daily report

### Inspectors
- `GET /api/inspectors` - List inspectors
- `POST /api/inspectors` - Create new inspector
- `GET /api/inspectors/{id}` - Get inspector details
- `PUT /api/inspectors/{id}` - Update inspector
- `DELETE /api/inspectors/{id}` - Delete inspector