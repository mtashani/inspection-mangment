# Project Structure

## Root Level Organization
```
├── backend/           # FastAPI backend service
├── frontend/          # Next.js frontend application
├── design-system/     # Shared design system and components
├── memory-bank/       # Project documentation and context
├── .kiro/            # Kiro IDE configuration and specs
├── alembic/          # Database migration scripts
└── tests/            # Cross-project integration tests
```

## Backend Structure (Domain-Driven Design)
```
backend/
├── app/
│   ├── domains/          # Business domains (DDD approach)
│   │   ├── auth/         # Authentication and authorization
│   │   ├── equipment/    # Equipment management
│   │   ├── inspection/   # Inspection workflows
│   │   ├── report/       # Professional reporting system
│   │   ├── psv/          # PSV calibration tracking
│   │   ├── corrosion/    # Corrosion monitoring
│   │   ├── crane/        # Crane inspection management
│   │   └── maintenance/  # Maintenance planning
│   ├── api/v1/          # API route definitions
│   ├── routers/         # FastAPI router modules
│   ├── core/            # Core configuration and settings
│   ├── common/          # Shared utilities and services
│   └── storage/         # File storage handling
├── tests/               # Backend-specific tests
└── requirements.txt     # Python dependencies
```

## Frontend Structure (Next.js App Router)
```
frontend/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable React components
│   ├── lib/             # Utility functions and configurations
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── .storybook/          # Storybook configuration
└── package.json         # Node.js dependencies
```

## Domain Organization Principles

### Backend Domains
Each domain follows a consistent structure:
- `models/` - SQLModel database models
- `services/` - Business logic and domain services
- `repositories/` - Data access layer (if needed)
- `tests/` - Domain-specific tests
- `examples/` - Usage examples and demonstrations

### Key Domains
- **Report Domain**: Template management, auto-field system, report generation
- **Inspection Domain**: Inspection workflows, completion tracking
- **Equipment Domain**: Asset management, maintenance history
- **Auth Domain**: User management, role-based access control

## Configuration Files
- `.env` files for environment-specific settings
- `alembic.ini` for database migration configuration
- `pytest.ini` for test configuration
- `components.json` for shadcn/ui component configuration

## Testing Strategy
- Unit tests within each domain's `tests/` directory
- Integration tests in root `tests/` directory
- End-to-end tests covering full workflows
- API tests using httpx and pytest
- Frontend tests using Jest and React Testing Library

## File Naming Conventions
- Python: snake_case for files and functions
- TypeScript: camelCase for variables, PascalCase for components
- Test files: `test_*.py` for Python, `*.test.ts` for TypeScript
- Component files: PascalCase matching component name