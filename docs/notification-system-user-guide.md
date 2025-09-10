# Real-Time Notification System - User Guide

## Overview

The Real-Time Notification System provides instant notifications for maintenance events, inspections, and system alerts within the Frontend-v2 application. The system uses WebSocket connections to deliver notifications in real-time without requiring page refreshes.

## 🔔 Features

### Notification Types
- **Event Created**: New maintenance events are created
- **Event Updated**: Existing maintenance events are modified
- **Event Status Changed**: Maintenance event status changes
- **Inspection Created**: New inspections are scheduled
- **Inspection Completed**: Inspections are finished
- **Calibration Due**: Equipment calibration reminders
- **System Alerts**: Important system messages
- **Task Complete**: Task completion notifications

### Priority Levels
- **🔴 Critical**: Urgent issues requiring immediate attention
- **🟡 High**: Important notifications
- **🟢 Medium**: Standard notifications (default)
- **⚪ Low**: Informational notifications

## 🚀 Getting Started

### For End Users

#### Viewing Notifications
1. **Notification Bell**: Located in the top navigation bar
2. **Badge Counter**: Shows unread notification count
3. **Connection Status**: Green/red indicator shows WebSocket connection status

#### Managing Notifications
1. **Click Bell Icon**: Opens notification dropdown
2. **Mark as Read**: Notifications auto-mark as read when dropdown opens
3. **Individual Actions**: Click "X" to dismiss specific notifications
4. **Navigation**: Click notification title to navigate to related content

#### Connection Status Indicators
- 🟢 **Connected**: Real-time notifications active
- 🟡 **Connecting**: Establishing connection
- 🔴 **Disconnected**: Using fallback mode with mock data

### Notification Preferences

#### Access Preferences
- Click the settings icon (⚙️) in the notification dropdown
- Navigate to your profile settings (feature coming soon)

#### Available Settings
- **Notification Types**: Enable/disable specific notification types
- **Delivery Methods**: Web notifications, email (future), push notifications (future)
- **Sound Settings**: Enable/disable notification sounds and volume
- **Timing**: Daily summary preferences and reminder timing

## 🛠 Technical Implementation

### Frontend-v2 Integration

#### Components Used
- **RealTimeNotificationsProvider**: Context provider for notification state
- **RealTimeLayout**: Layout wrapper with notification integration  
- **Notifications Component**: UI component in navigation bar
- **WebSocket Service**: Real-time communication client

#### File Locations
```
frontend-v2/src/
├── contexts/real-time-notifications.tsx       # State management
├── lib/services/websocket-service.ts          # WebSocket client
├── components/navigation/notifications.tsx    # UI component
└── components/layout/real-time-layout.tsx     # Layout integration
```

### Backend Integration

#### API Endpoints
- `GET /api/v1/notifications/` - Get user notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `GET /api/v1/notifications/preferences` - Get preferences
- `PUT /api/v1/notifications/preferences` - Update preferences
- `WS /api/v1/notifications/ws/notifications` - WebSocket connection

#### Database Tables
- **notifications**: Stores notification records
- **notification_preferences**: User preference settings

## 🔧 Troubleshooting

### Common Issues

#### No Notifications Appearing
1. **Check Connection**: Look for connection status indicator
2. **Refresh Browser**: Reload the page to reconnect
3. **Check Preferences**: Ensure notification types are enabled

#### WebSocket Connection Issues
1. **Network Problems**: Check internet connection
2. **Backend Service**: Ensure backend server is running
3. **Browser Support**: Verify WebSocket support in browser

#### Performance Issues
1. **Too Many Notifications**: System automatically limits to recent notifications
2. **Memory Usage**: Notifications are cleaned up automatically
3. **Connection Lag**: System includes automatic reconnection with backoff

### Browser Compatibility
- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **Edge**: Full support ✅

### Fallback Mode
When WebSocket connection fails, the system automatically:
- Displays mock notifications for demonstration
- Shows connection status as disconnected
- Attempts automatic reconnection
- Provides feedback about connection issues

## 📱 Mobile Support

The notification system is fully responsive and works on:
- **Desktop**: Full feature set
- **Tablet**: Touch-optimized interface
- **Mobile**: Compact notification display

## 🔐 Security

### Authentication
- WebSocket connections require valid authentication token
- Notifications are filtered by user permissions
- Personal notifications are only visible to intended recipients

### Data Privacy
- Notification data is encrypted in transit
- Personal information is not stored in notification metadata
- Users control their own notification preferences

## 🎨 Customization

### Visual Themes
The notification system automatically adapts to:
- Light/Dark theme switching
- System theme preferences
- Custom color schemes

### Sound Preferences
- Enable/disable notification sounds
- Volume control (low, medium, high)
- Respect system sound settings

## 📊 Analytics & Monitoring

### User Metrics (Admin Only)
- Notification delivery rates
- User engagement with notifications
- Connection stability statistics
- Performance monitoring

### Developer Tools
- Browser console logs for debugging
- Connection status monitoring
- Error reporting and tracking

## 🚀 Future Enhancements

### Planned Features
- **Email Notifications**: Send important notifications via email
- **Push Notifications**: Browser push notification support
- **Advanced Filtering**: Custom notification filters and rules
- **Notification History**: Extended notification history view
- **Bulk Actions**: Mark all as read, archive options
- **Mobile App**: Native mobile app integration

### API Extensions
- **Webhook Support**: Third-party integrations
- **Notification Templates**: Customizable notification formatting
- **Advanced Routing**: Smart notification routing rules

## 📞 Support

### Getting Help
- **Documentation**: Refer to this guide and API documentation
- **Technical Issues**: Contact system administrator
- **Feature Requests**: Submit through proper channels

### Known Limitations
- Maximum 50 notifications displayed at once
- 30-day notification retention period
- WebSocket requires stable internet connection
- Some older browsers may have limited support

---

*This guide covers the Real-Time Notification System for Frontend-v2. For technical implementation details, see the deployment guide.*