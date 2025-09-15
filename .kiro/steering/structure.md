# Project Structure

## Repository Organization

This is a monorepo containing both frontend and backend applications for the Inspection Management System.

```
inspection-management/
├── frontend-v2/           # Next.js frontend application
├── backend/               # FastAPI backend application
├── docs/                  # Project documentation
├── tests/                 # Cross-project tests
├── alembic/               # Database migrations (legacy)
├── node_modules/          # Root dependencies
└── package.json           # Root package configuration
```

## Frontend Structure (frontend-v2/)

### Application Architecture
```
frontend-v2/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── equipment/         # Equipment management
│   │   ├── psv/              # PSV inspection pages
│   │   ├── ndt/              # NDT inspection pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── auth/             # Authentication components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── examples/         # Integration examples
│   ├── contexts/             # React contexts (auth, permissions)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   │   ├── utils.ts          # General utilities
│   │   ├── auth-utils.ts     # Authentication utilities
│   │   └── api.ts            # API client
│   ├── types/                # TypeScript definitions
│   │   └── permissions.ts    # RBAC type definitions
│   └── constants/            # Application constants
├── docs/                     # Frontend documentation
│   ├── RBAC_QUICK_START.md   # RBAC implementation guide
│   ├── RBAC_DEVELOPER_GUIDE.md
│   └── RBAC_MIGRATION_CHECKLIST.md
├── e2e/                      # Playwright E2E tests
├── public/                   # Static assets
└── __tests__/               # Jest unit tests
```

### Key Conventions
- **Page Routes**: Use App Router with route groups `(auth)` for organization
- **Components**: Atomic design - ui/ for primitives, feature folders for complex components
- **Contexts**: Separate contexts for auth and permissions with proper TypeScript typing
- **Hooks**: Custom hooks for reusable logic (usePermissions, useNavigation)
- **Types**: Centralized type definitions, especially for RBAC system

## Backend Structure (backend/)

### Domain-Driven Architecture
```
backend/
├── app/
│   ├── domains/              # Business domains
│   │   ├── rbi/             # Risk-Based Inspection domain
│   │   │   ├── services/    # Business logic services
│   │   │   ├── models/      # Domain models
│   │   │   ├── tests/       # Domain-specific tests
│   │   │   └── examples/    # Usage examples
│   │   ├── inspections/     # Inspection management
│   │   ├── equipment/       # Equipment management
│   │   └── auth/           # Authentication domain
│   ├── core/               # Core application logic
│   │   ├── database.py     # Database configuration
│   │   ├── security.py     # Security utilities
│   │   └── config.py       # Application settings
│   ├── api/                # API routes
│   │   ├── v1/            # API version 1
│   │   └── dependencies.py # Route dependencies
│   └── main.py            # FastAPI application entry
├── alembic/               # Database migrations
├── tests/                 # Integration tests
├── storage/               # File storage
├── logs/                  # Application logs
└── requirements.txt       # Python dependencies
```

### Key Conventions
- **Domain Organization**: Each business domain has its own folder with services, models, tests
- **Service Layer**: Business logic separated from API routes
- **Repository Pattern**: Data access abstraction in each domain
- **Testing**: Domain-specific tests alongside implementation files
- **Examples**: Usage examples for complex services (RBI calculation engine)

## Configuration Files

### Frontend Configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration (strict mode)
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - E2E testing configuration
- `components.json` - shadcn/ui configuration

### Backend Configuration
- `alembic.ini` - Database migration configuration
- `pytest.ini` - Testing configuration
- `.env` / `.env.example` - Environment variables

## Documentation Structure

### Project Documentation (docs/)
- `notification-system-*.md` - Notification system documentation
- `websocket-error-fixes.md` - WebSocket troubleshooting

### Frontend Documentation (frontend-v2/docs/)
- `RBAC_*.md` - Role-based access control documentation
- Component-specific README files

### Inline Documentation
- Each complex service has accompanying examples/ folder
- README files in component directories
- Comprehensive JSDoc/docstring comments

## File Naming Conventions

### Frontend
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`usePermissions.ts`)
- **Utilities**: kebab-case (`auth-utils.ts`)
- **Types**: kebab-case (`permissions.ts`)
- **Pages**: kebab-case following Next.js conventions

### Backend
- **Files**: snake_case (`rbi_calculation_engine.py`)
- **Classes**: PascalCase (`RBICalculationEngine`)
- **Functions**: snake_case (`calculate_risk_score`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_RISK_MATRIX`)

## Import Conventions

### Frontend
```typescript
// External libraries first
import React from 'react';
import { NextPage } from 'next';

// Internal imports with @ alias
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import type { Permission } from '@/types/permissions';
```

### Backend
```python
# Standard library
from typing import List, Optional
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends
from sqlmodel import Session

# Local imports
from app.core.database import get_session
from app.domains.rbi.services.rbi_calculation_engine import RBICalculationEngine
```

## Testing Organization

### Frontend Tests
- Unit tests alongside components (`__tests__/` folders)
- Integration tests in `e2e/` directory
- Test utilities in `src/lib/test-utils.ts`

### Backend Tests
- Domain tests in `domains/*/tests/`
- Integration tests in root `tests/` directory
- Test fixtures and utilities shared across domains