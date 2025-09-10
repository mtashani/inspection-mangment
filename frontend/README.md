# Inspection Management System - Frontend

A modern, responsive web application for managing industrial equipment inspections built with Next.js 15, React 19, and TypeScript.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or pnpm/yarn)
- **Git**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inspection-management/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your actual values
   # At minimum, set:
   # NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Running Tests

### All Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Specific Test Types
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Browser tests with MCP Playwright
npm run test:browser

# Accessibility tests
npm run test:accessibility

# Performance tests
npm run test:performance

# Mobile responsiveness tests
npm run test:mobile

# Offline functionality tests
npm run test:offline
```

### Browser-Specific Tests
```bash
# Run all browser automation tests
npm run test:browser

# Run specific browser test types
npm run test:browser:unit
npm run test:browser:integration
npm run test:browser:e2e
npm run test:browser:accessibility
npm run test:browser:performance
```

## 🏗️ Build and Deployment

### Development Build
```bash
npm run build
npm run start
```

### Production Build
```bash
# Set production environment
NODE_ENV=production npm run build

# Start production server
npm run start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t inspection-frontend .

# Run with Docker Compose
docker-compose up -d

# Or run specific environment
docker-compose -f docker-compose.staging.yml up -d
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   ├── dashboard/         # Dashboard widgets
│   │   ├── equipment/         # Equipment management
│   │   ├── inspection/        # Inspection components
│   │   ├── reporting/         # Report generation
│   │   ├── admin/             # Admin features
│   │   ├── mobile/            # Mobile-optimized components
│   │   └── accessibility/     # Accessibility features
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── services/              # API services
│   ├── utils/                 # Helper utilities
│   ├── styles/                # Global styles
│   └── test/                  # Test files and utilities
│       ├── __tests__/         # Unit tests
│       ├── integration/       # Integration tests
│       ├── e2e/              # End-to-end tests
│       └── browser/          # MCP Playwright tests
├── public/                    # Static assets
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
└── .github/                   # GitHub Actions workflows
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript check
```

### Testing
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests
npm run test:e2e          # Run end-to-end tests
npm run test:browser      # Run browser automation tests
npm run test:accessibility # Run accessibility tests
npm run test:performance  # Run performance tests
npm run test:mobile       # Run mobile tests
npm run test:offline      # Run offline functionality tests
npm run test:ci           # Run tests for CI/CD
```

### Storybook
```bash
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build Storybook for production
```

### Analysis
```bash
npm run analyze         # Analyze bundle size
npm run lighthouse      # Run Lighthouse audit
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Inspection Management System"

# Optional
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
```

### Environment Files
- `.env.example` - Template with all available variables
- `.env.development` - Development environment settings
- `.env.staging` - Staging environment settings
- `.env.production` - Production environment settings
- `.env.local` - Local overrides (not committed to git)

## 🧪 Testing Guide

### Unit Tests
Located in `__tests__` directories alongside components:
```bash
src/components/dashboard/__tests__/dashboard-widget.test.tsx
```

### Integration Tests
Located in `src/test/integration/`:
```bash
src/test/integration/dashboard-workflow.test.tsx
```

### E2E Tests
Located in `src/test/e2e/`:
```bash
src/test/e2e/user-journey.test.tsx
```

### Browser Tests (MCP Playwright)
Located in `src/test/browser/`:
```bash
src/test/browser/report-creation-flow.test.ts
src/test/browser/accessibility-testing.test.ts
src/test/browser/performance-testing.test.ts
```

### Test Utilities
- `src/test/test-utils.tsx` - Custom render function and utilities
- `src/test/setup.ts` - Jest setup and configuration
- `src/test/browser/playwright-helpers.ts` - Browser automation helpers

## 📱 Mobile Development

The application is fully responsive and includes:
- Mobile-optimized components
- Touch-friendly interfaces
- Offline functionality
- Progressive Web App (PWA) features
- Camera integration for inspections

Test mobile features:
```bash
npm run test:mobile
```

## ♿ Accessibility

Built with accessibility in mind:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus management

Test accessibility:
```bash
npm run test:accessibility
```

## 🔒 Security

Security features include:
- Content Security Policy (CSP)
- XSS protection
- CSRF protection
- Secure headers
- Input validation
- Authentication and authorization

## 📊 Performance

Performance optimizations:
- Code splitting
- Image optimization
- Bundle analysis
- Lazy loading
- Service worker caching
- Core Web Vitals optimization

Monitor performance:
```bash
npm run test:performance
npm run analyze
npm run lighthouse
```

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Staging
```bash
# Using Docker
docker-compose -f docker-compose.staging.yml up -d

# Using deployment script
./scripts/deploy.sh staging
```

### Production
```bash
# Using Docker
docker-compose -f docker-compose.production.yml up -d

# Using deployment script
./scripts/deploy.sh production
```

## 📚 Documentation

- [User Guide](./docs/USER_GUIDE.md) - Complete user documentation
- [Admin Guide](./docs/ADMIN_GUIDE.md) - Administrator documentation
- [Features Overview](./docs/FEATURES_OVERVIEW.md) - Feature descriptions
- [Troubleshooting](./docs/TROUBLESHOOTING_FAQ.md) - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Quality

Before submitting:
```bash
npm run lint        # Check code style
npm run type-check  # Check TypeScript
npm test           # Run all tests
npm run build      # Ensure build works
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

**Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Test failures:**
```bash
# Clear Jest cache
npm test -- --clearCache
```

For more troubleshooting, see [Troubleshooting Guide](./docs/TROUBLESHOOTING_FAQ.md).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- Documentation: [./docs/](./docs/)
- Issues: [GitHub Issues](https://github.com/your-org/inspection-management/issues)
- Email: support@yourcompany.com

---

**Version**: 2.0.0  
**Last Updated**: February 2024