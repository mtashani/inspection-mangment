# Real-Time Notification System - Deployment Guide

## Overview

This guide provides comprehensive deployment instructions for the Real-Time Notification System in the Inspection Management platform, specifically configured for Frontend-v2 with SQLite database support.

## 🏗 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend-v2   │    │   Backend API    │    │   SQLite DB     │
│                 │    │                  │    │                 │
│ • React Context │◄──►│ • FastAPI        │◄──►│ • notifications │
│ • WebSocket     │    │ • WebSocket      │    │ • preferences   │
│ • Toast UI      │    │ • SQLModel       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### System Requirements
- **Python**: 3.12+ with virtual environment support
- **Node.js**: 18+ with npm/yarn
- **Database**: SQLite (for development) or PostgreSQL (for production)
- **Browser**: Modern browsers with WebSocket support

### Development Environment
- **Operating System**: Windows 10/11 (current setup)
- **IDE**: VS Code or similar with Python and TypeScript support
- **Git**: Version control access to repository

## 🚀 Installation Steps

### 1. Backend Setup

#### Navigate to Backend Directory
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\backend"
```

#### Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```

#### Install Dependencies
```powershell
pip install -r requirements.txt
```

#### Database Initialization
```powershell
# Create all database tables (includes notification tables)
python -c "from app.database import create_db_and_tables; create_db_and_tables(); print('Database tables created successfully')"
```

#### Verify Notification Tables
```powershell
python check_db_tables.py
```

Expected output should show:
- `notifications` table with 15 columns
- `notification_preferences` table with 24 columns

### 2. Frontend-v2 Setup

#### Navigate to Frontend Directory
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\frontend-v2"
```

#### Install Dependencies
```powershell
npm install
```

#### Environment Configuration
Create or update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Service Integration

#### Backend Configuration
The notification system is automatically registered in `app/main.py`:
```python
# Notification System Router (Real-time Notifications)
from app.domains.notifications.api import notification_router, websocket_router
app.include_router(notification_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notifications"])
app.include_router(websocket_router, prefix=f"{settings.API_V1_STR}/notifications", tags=["WebSocket Notifications"])
```

#### Frontend Integration
The notification system is integrated in `app/layout.tsx`:
```tsx
<RealTimeNotificationsProvider>
  <AuthGuard>
    <RealTimeLayout>{children}</RealTimeLayout>
  </AuthGuard>
</RealTimeNotificationsProvider>
```

## 🔧 Configuration

### Backend Configuration

#### Database Settings (app/core/config.py)
```python
# SQLite configuration for development
DATABASE_URL = "sqlite:///backend/inspection_management.db"
SQL_ECHO = False  # Set to True for debugging
```

#### WebSocket Settings
```python
# Default WebSocket endpoint
WS_ENDPOINT = "/api/v1/notifications/ws/notifications"
```

### Frontend Configuration

#### WebSocket Service Configuration
File: `frontend-v2/src/lib/services/websocket-service.ts`
```typescript
// WebSocket URL configuration
const WS_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000'
const WS_ENDPOINT = '/api/v1/notifications/ws/notifications'
```

#### Toast Notification Settings
File: `frontend-v2/src/app/layout.tsx`
```tsx
<Toaster 
  position="top-right" 
  richColors 
  closeButton 
  duration={4000}
/>
```

## 🏃 Running the System

### Development Mode

#### Start Backend Server
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

#### Start Frontend Development Server
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\frontend-v2"
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Production Deployment

#### Backend Production Setup
```powershell
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Production Build
```powershell
# Build production version
npm run build

# Start production server
npm start
```

## 🧪 Testing

### Backend Tests
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\backend"
.\venv\Scripts\Activate.ps1
python -m pytest app/domains/notifications/tests/ -v
```

### Frontend Tests
```powershell
cd "c:\Users\tashan\Documents\code\inspection mangment\frontend-v2"
npm test
```

### Integration Testing
1. **Start both backend and frontend servers**
2. **Open browser to** `http://localhost:3000`
3. **Check notification bell in navigation**
4. **Verify WebSocket connection status** (green indicator)
5. **Test notification creation** via API or admin interface

## 📊 Monitoring & Maintenance

### Health Checks

#### Backend Health
```bash
curl http://localhost:8000/api/v1/notifications/health
```

#### WebSocket Connection
```bash
curl http://localhost:8000/api/v1/notifications/ws/info
```

### Database Maintenance

#### Check Notification Tables
```powershell
python check_db_tables.py
```

#### Database Backup (SQLite)
```powershell
# Backup database file
copy inspection_management.db inspection_management_backup.db
```

### Log Monitoring

#### Backend Logs
- Check console output for WebSocket connections
- Monitor SQLite database operations
- Watch for notification broadcasting events

#### Frontend Logs
- Browser Developer Tools > Console
- WebSocket connection status
- Notification service debug messages

## 🔒 Security Considerations

### Authentication
- WebSocket connections require valid JWT tokens
- Tokens are passed as query parameters: `?token=<jwt_token>`
- Invalid tokens result in connection rejection

### Data Validation
- All notification data is validated using Pydantic models
- SQL injection protection via SQLModel/SQLAlchemy
- Input sanitization for notification content

### CORS Configuration
```python
# Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚀 Scaling & Performance

### Database Optimization
- SQLite is suitable for development and small deployments
- For production, migrate to PostgreSQL:
  ```python
  DATABASE_URL = "postgresql://user:password@localhost/inspection_db"
  ```

### WebSocket Scaling
- Current implementation supports moderate concurrent connections
- For high-scale deployments, consider Redis for connection management
- Implement connection pooling for database operations

### Frontend Optimization
- Notifications are limited to 50 most recent
- Automatic cleanup of old notifications
- Lazy loading for notification history

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Fails
```python
# Check backend logs for:
# - Authentication errors
# - Port conflicts
# - CORS issues
```

#### Database Connection Errors
```python
# Verify database file exists
# Check file permissions
# Ensure SQLite drivers are installed
```

#### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

#### Enable Backend Debug Logging
```python
# In app/core/config.py
SQL_ECHO = True
DEBUG = True
```

#### Enable Frontend Debug Mode
```typescript
// In websocket-service.ts
const DEBUG = true; // Enable console logging
```

## 📝 API Documentation

### REST Endpoints
- `GET /api/v1/notifications/` - List notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `GET /api/v1/notifications/preferences` - Get user preferences
- `PUT /api/v1/notifications/preferences` - Update preferences

### WebSocket Events
- **connection_established**: Client connected successfully
- **notification**: New notification received
- **ping/pong**: Heartbeat messages
- **error**: Connection or processing errors

## 🔄 Maintenance Tasks

### Daily Tasks
- Monitor application logs
- Check WebSocket connection health
- Verify notification delivery

### Weekly Tasks
- Review notification preferences usage
- Check database performance
- Update dependencies if needed

### Monthly Tasks
- Database cleanup of old notifications
- Performance optimization review
- Security updates and patches

## 📞 Support & Contacts

### Technical Issues
- **Backend**: Check FastAPI logs and database connections
- **Frontend**: Browser developer tools and console logs
- **WebSocket**: Connection status and error messages

### Performance Issues
- **Database**: Query optimization and indexing
- **Network**: WebSocket connection stability
- **Memory**: Notification cleanup and limits

---

*This deployment guide ensures successful implementation of the Real-Time Notification System for Frontend-v2 with SQLite database support.*