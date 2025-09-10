# نوتیفیکیشن سیستم تست گاید

## مشکل‌ها که حل شده‌اند:

### ✅ 1. بارگذاری نوتیفیکیشن‌های موجود در startup
- نوتیفیکیشن‌ها حالا در startup و بعد از authentication بارگذاری می‌شوند
- اتصال WebSocket نیز trigger می‌کند تا نوتیفیکیشن‌ها reload شوند

### ✅ 2. نوتیفیکیشن برای ساخت بازرسی (پلن و غیرپلن) 
- تمام endpoints برای ساخت بازرسی حالا نوتیفیکیشن می‌فرستند
- هم planned inspections و هم unplanned inspections پوشش داده شده

### ✅ 3. بهبود NotificationBell component
- اضافه شدن refresh button
- نمایش وضعیت اتصال (Live & Synced, Live, Backend Only, Offline)
- بهبود UI برای وضعیت‌های مختلف

## تست کردن سیستم:

### مرحله ۱: تست Authentication
1. سرور backend را اجرا کنید: `cd backend && uvicorn app.main:app --reload`
2. frontend را اجرا کنید: `npm run dev`
3. به صفحه debug بروید: `http://localhost:3001/test-debug`
4. وضعیت Authentication را چک کنید

### مرحله ۲: تست Backend API
1. در debug panel، "Refresh Notifications" را کلیک کنید
2. اگر مشکل authentication باشد، ابتدا login کنید
3. Console browser را چک کنید برای log های مربوطه

### مرحله ۳: تست WebSocket
1. در debug panel، "Connect WebSocket" را کلیک کنید
2. وضعیت اتصال را در notification bell چک کنید
3. باید "Live & Synced" نمایش دهد

### مرحله ۴: تست Real-time Notifications
1. یک maintenance event جدید بسازید
2. یک inspection جدید بسازید (planned یا unplanned)
3. notification bell باید تعداد unread را نشان دهد

## عیب‌یابی:

### اگر notification count صفر است:
1. Console browser را چک کنید
2. مطمئن شوید که login کرده‌اید
3. مطمئن شوید که backend server در حال اجرا است
4. در debug panel، manual refresh کنید
5. مطمئن شوید که در دیتابیس notification وجود دارد

### اگر real-time کار نمی‌کند:
1. WebSocket connection status را چک کنید
2. مطمئن شوید authentication token درست است
3. Backend logs را چک کنید برای WebSocket errors

## چک کردن دیتابیس:
```sql
-- Check notifications in database
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Check notification count
SELECT COUNT(*) as total, status FROM notifications GROUP BY status;
```

## Useful Console Commands:
در browser console:
```javascript
// Check auth token
console.log('Token:', localStorage.getItem('access_token'));

// Manual refresh notifications
// (در component که useRealTimeNotifications استفاده می‌کند)
// loadPersistedNotifications();
```