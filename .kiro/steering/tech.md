# Technology Stack

## Architecture
Full-stack web application with separate backend and frontend services.

## Backend Stack
- **Framework**: FastAPI (0.104.x) with Python 3.12+
- **Database**: SQLAlchemy 2.0+ with SQLModel, PostgreSQL primary, SQLite for development
- **Authentication**: JWT tokens with python-jose, bcrypt for password hashing
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Testing**: pytest with httpx for API testing
- **Code Quality**: black, flake8, isort, mypy, pre-commit hooks

## Frontend Stack
- **Framework**: Next.js 15+ with React 19
- **Language**: TypeScript 5.7+ with strict mode enabled
- **Type Safety**: No `any` types allowed - use `unknown`, specific interfaces, or generic types
- **Styling**: Tailwind CSS 4.1+ with Radix UI components
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts and Chart.js with react-chartjs-2
- **Testing**: Jest with React Testing Library
- **Development**: Storybook for component development

## Development Tools
- **Package Management**: npm/pnpm for frontend, pip with virtual environments for backend
- **Database Migrations**: Alembic
- **API Client**: httpx for backend testing
- **Date Handling**: Jalaali calendar support (Persian dates)

## Common Commands

### Backend Development
```bash
# Setup
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Database
python reset_db.py              # Reset database
python reset_and_seed_all.py    # Reset and seed with data
alembic upgrade head             # Run migrations

# Running
uvicorn app.main:app --reload    # Development server (port 8000)

# Testing
pytest                           # Run all tests
pytest tests/                    # Run specific test directory
```

### Frontend Development
```bash
# Setup
npm install  # or pnpm install

# Development
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Jest tests
npm run storybook    # Storybook dev server (port 6006)
```

## API Documentation
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## TypeScript Best Practices
- **Strict Mode**: Always use `"strict": true` in tsconfig.json
- **No Any Types**: Avoid `any` - use alternatives:
  - `unknown` for truly unknown data
  - Specific interfaces for structured data
  - Generic types `<T>` for reusable components
  - Union types `string | number` for known possibilities
- **Type Definitions**: Create proper interfaces in `src/types/`
- **ESLint Rules**: `@typescript-eslint/no-explicit-any` enabled

## Environment Configuration
- Backend: `.env` file with database connection, JWT secrets
- Frontend: `.env.local` for Next.js environment variables
- Examples provided in `.env.example` files