# Authentication Components

این پوشه شامل کامپوننت‌های مربوط به احراز هویت سیستم است.

## کامپوننت‌های موجود

### 1. EnhancedLoginPage
صفحه لاگین بهبود یافته با ویژگی‌های زیر:
- طراحی مدرن و responsive
- انیمیشن‌های smooth و professional
- نمایش ویژگی‌های سیستم به صورت interactive
- پشتیبانی از dark mode
- استفاده کامل از design system

### 2. EnhancedLoginForm
فرم لاگین پیشرفته با قابلیت‌های:
- Validation در real-time
- نمایش وضعیت فیلدها (success/error)
- انیمیشن‌های loading
- پشتیبانی از accessibility
- طراحی responsive

### 3. ModernLoginPage (Legacy)
نسخه قبلی صفحه لاگین که هنوز در دسترس است.

### 4. ModernLoginForm (Legacy)
نسخه قبلی فرم لاگین.

## استفاده

### استفاده از کامپوننت جدید:
```tsx
import { EnhancedLoginPage } from '@/components/auth/enhanced-login-page'

export default function LoginPage() {
  return <EnhancedLoginPage />
}
```

### استفاده از فرم به تنهایی:
```tsx
import { EnhancedLoginForm } from '@/components/auth/enhanced-login-form'

export default function CustomLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <EnhancedLoginForm onSuccess={() => console.log('Login successful!')} />
    </div>
  )
}
```

## ویژگی‌های طراحی

### رنگ‌ها و تم
- استفاده از CSS variables برای consistency
- پشتیبانی کامل از dark mode
- رنگ‌های semantic برای وضعیت‌های مختلف

### انیمیشن‌ها
- انیمیشن‌های entrance برای loading
- Hover effects برای interactive elements
- Progress indicators برای نمایش وضعیت
- Micro-interactions برای بهبود UX

### Accessibility
- Support کامل برای screen readers
- Keyboard navigation
- High contrast mode support
- Reduced motion support

## فایل‌های CSS

### login-animations.css
شامل انیمیشن‌های custom برای:
- Float effects
- Gradient animations
- Loading states
- Success/Error states
- Hover effects

## بهبودهای اعمال شده

### مشکلات حل شده:
1. ✅ **اینپوت‌ها استایل ندارند**: استفاده صحیح از shadcn/ui Input component
2. ✅ **نظم و چیدمان**: استفاده از design system components به جای inline styles
3. ✅ **پرگرس بار کوچک**: Progress indicators بزرگتر و واضح‌تر
4. ✅ **ظاهر بی‌روح**: انیمیشن‌ها و visual hierarchy بهتر
5. ✅ **رنگ‌های hardcoded**: استفاده از design tokens
6. ✅ **Import های اضافی**: پاکسازی و بهینه‌سازی imports
7. ✅ **Inline styles**: تبدیل به CSS classes و design system

### ویژگی‌های جدید:
- Real-time validation با shadcn components
- Better error handling با Alert component
- Enhanced visual feedback با design tokens
- Improved loading states با Button component
- Professional animations با Tailwind classes
- Better responsive design با Grid system
- Design system integration کامل
- Storybook stories برای تست و نمایش

## تنظیمات

### Environment Variables
```env
# در فایل .env.local
NEXT_PUBLIC_APP_NAME="Inspection Pro"
NEXT_PUBLIC_APP_VERSION="2.1"
```

### Theme Configuration
کامپوننت‌ها از design system استفاده می‌کنند و تم‌های مختلف را پشتیبانی می‌کنند:
- Base theme (default)
- Cool Blue
- Warm Sand
- Midnight Purple
- Soft Gray
- Warm Cream

## Performance

### بهینه‌سازی‌های اعمال شده:
- Lazy loading برای کامپوننت‌های غیرضروری
- Optimized animations با CSS transforms
- Reduced bundle size با tree shaking
- Efficient re-renders با proper state management

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## مشارکت

برای اضافه کردن ویژگی جدید یا بهبود کامپوننت‌ها:

1. از design system استفاده کنید
2. Accessibility guidelines را رعایت کنید
3. انیمیشن‌ها را با `prefers-reduced-motion` تست کنید
4. Dark mode compatibility را بررسی کنید

## TODO

- [ ] اضافه کردن 2FA support
- [ ] Social login integration
- [ ] Remember me functionality
- [ ] Password strength indicator
- [ ] Biometric authentication support