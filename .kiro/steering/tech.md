# Technology Stack

## Frontend (Next.js Application)

### Core Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5+ (strict mode)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4+ with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) + Context API
- **Forms**: React Hook Form + Zod validation
- **Authentication**: JWT with jose library
- **Date Handling**: date-fns + jalaali-js (Persian calendar support)

### Key Libraries
- **UI Components**: Radix UI primitives, Lucide React icons
- **Data Fetching**: Axios + React Query
- **Charts**: Recharts
- **File Processing**: xlsx for Excel exports
- **Drag & Drop**: @dnd-kit
- **Notifications**: Sonner

### Development Tools
- **Testing**: Jest + React Testing Library + Playwright (E2E)
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Bundle Analysis**: @next/bundle-analyzer

## Backend (FastAPI Application)

### Core Technologies
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.8+
- **ASGI Server**: Uvicorn with standard extras
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: SQLModel + SQLAlchemy 2.0+
- **Migrations**: Alembic
- **Authentication**: python-jose + passlib + bcrypt

### Key Libraries
- **Validation**: Pydantic v2 + pydantic-settings
- **Data Processing**: pandas 2.1+
- **Date Handling**: python-dateutil + jdatetime
- **Environment**: python-dotenv
- **File Uploads**: python-multipart

### Development Tools
- **Testing**: pytest + httpx
- **Code Quality**: black + flake8 + isort + mypy
- **Pre-commit**: pre-commit hooks

## Common Commands

### Frontend Development
```bash
# Development
npm run dev              # Start dev server on port 3001
npm run build            # Production build
npm run start            # Start production server

# Testing
npm run test             # Unit tests
npm run test:e2e         # E2E tests with Playwright
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript validation
npm run format           # Prettier formatting

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run container
```

### Backend Development
```bash
# Environment Setup
python -m venv venv
venv\Scripts\activate    # Windows
source venv/bin/activate # Linux/Mac
pip install -r requirements.txt

# Development
uvicorn app.main:app --reload  # Start dev server
python reset_db.py             # Reset database
python reset_and_seed_all.py   # Seed with test data

# Testing
pytest                   # Run all tests
pytest --coverage        # With coverage report

# Code Quality
black .                  # Format code
flake8 .                # Lint check
isort .                 # Import sorting
mypy .                  # Type checking
```

## Architecture Patterns

### Frontend Patterns
- **Component Architecture**: Atomic design with shadcn/ui base components
- **State Management**: Server state (React Query) + Client state (Context/useState)
- **Error Handling**: Error boundaries + toast notifications
- **Performance**: Code splitting, lazy loading, React.memo optimization
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA attributes

### Backend Patterns
- **Domain-Driven Design**: Organized by business domains (RBI, inspections, etc.)
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **Dependency Injection**: FastAPI's built-in DI system
- **Error Handling**: Structured exception handling with proper HTTP status codes

## Environment Configuration

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_APP_NAME="Inspection Management System"
```

### Backend Environment Variables
```bash
DATABASE_URL=sqlite:///./inspection_management.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Development Workflow

1. **Code Standards**: TypeScript strict mode, ESLint rules, Prettier formatting
2. **Testing**: Minimum 80% coverage, unit + integration + E2E tests
3. **Git Workflow**: Feature branches, conventional commits
4. **CI/CD**: Automated testing, type checking, and linting on PRs