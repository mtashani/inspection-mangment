'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute, PermissionGuard } from '@/components/auth';
import { CreateButton, EditButton, DeleteButton } from '@/components/ui/permission-components';
import { usePermissions, useRoles } from '@/hooks/use-permissions';
import { RESOURCES, ACTIONS } from '@/types/permissions';

/**
 * مثال عملی از نحوه integration سیستم RBAC با صفحات ادمین پنل موجود
 */

// مثال 1: صفحه لیست بازرسان با permission checks
function InspectorsListPage() {
  const { hasPermission } = usePermissions();
  const { isAdmin, isManager } = useRoles();
  
  // فرض کنیم این داده‌ها از API می‌آیند
  const inspectors = [
    { id: 1, name: 'احمد محمدی', role: 'PSV Inspector', active: true },
    { id: 2, name: 'فاطمه احمدی', role: 'NDT Inspector', active: true },
    { id: 3, name: 'علی رضایی', role: 'Mechanical Inspector', active: false },
  ];

  return (
    <ProtectedRoute permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">مدیریت بازرسان</h1>
            <p className="text-muted-foreground">مدیریت و نظارت بر بازرسان سیستم</p>
          </div>
          
          <CreateButton resource={RESOURCES.INSPECTOR}>
            افزودن بازرس جدید
          </CreateButton>
        </div>

        {/* نمایش آمار فقط برای مدیران */}
        {isManager() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">کل بازرسان</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">10</div>
                <div className="text-sm text-muted-foreground">فعال</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">2</div>
                <div className="text-sm text-muted-foreground">غیرفعال</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* لیست بازرسان */}
        <div className="grid gap-4">
          {inspectors.map(inspector => (
            <Card key={inspector.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{inspector.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{inspector.role}</Badge>
                      <Badge variant={inspector.active ? 'default' : 'destructive'}>
                        {inspector.active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <EditButton resource={RESOURCES.INSPECTOR}>
                      ویرایش
                    </EditButton>
                    
                    {/* فقط ادمین‌ها می‌توانند بازرسان را حذف کنند */}
                    <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}>
                      <DeleteButton resource={RESOURCES.INSPECTOR} scope="all">
                        حذف
                      </DeleteButton>
                    </PermissionGuard>
                    
                    {/* دکمه تغییر وضعیت */}
                    <PermissionGuard permission={{ resource: RESOURCES.INSPECTOR, action: ACTIONS.MANAGE }}>
                      <Button variant="outline" size="sm">
                        {inspector.active ? 'غیرفعال کردن' : 'فعال کردن'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* بخش مدیریت نقش‌ها - فقط برای Global Admin */}
        <PermissionGuard 
          permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES }}
          fallback={
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  برای دسترسی به بخش مدیریت نقش‌ها، نیاز به مجوز مدیریت نقش‌ها دارید.
                </p>
              </CardContent>
            </Card>
          }
        >
          <Card>
            <CardHeader>
              <CardTitle>مدیریت نقش‌ها</CardTitle>
              <CardDescription>تعریف و مدیریت نقش‌های سیستم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button>مشاهده نقش‌ها</Button>
                <Button variant="outline">ایجاد نقش جدید</Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      </div>
    </ProtectedRoute>
  );
}

// مثال 2: فرم ایجاد/ویرایش بازرس با permission-based fields
function InspectorForm({ inspectorId }: { inspectorId?: number }) {
  const { hasPermission } = usePermissions();
  const isEditing = !!inspectorId;

  return (
    <ProtectedRoute 
      permission={{ 
        resource: RESOURCES.INSPECTOR, 
        action: isEditing ? ACTIONS.EDIT_ALL : ACTIONS.CREATE 
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'ویرایش بازرس' : 'افزودن بازرس جدید'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {/* فیلدهای اصلی - همه می‌توانند ببینند */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">نام</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="نام بازرس"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">نام خانوادگی</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded"
                  placeholder="نام خانوادگی"
                />
              </div>
            </div>

            {/* فیلدهای حساس - فقط مدیران */}
            <PermissionGuard 
              permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}
              fallback={
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm text-muted-foreground">
                    برخی فیلدها فقط برای مدیران قابل ویرایش است.
                  </p>
                </div>
              }
            >
              <div className="space-y-4 p-4 border rounded bg-blue-50">
                <h3 className="font-medium text-blue-800">تنظیمات مدیریتی</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">نقش</label>
                    <select className="w-full p-2 border rounded">
                      <option>PSV Inspector</option>
                      <option>NDT Inspector</option>
                      <option>Mechanical Inspector</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">وضعیت</label>
                    <select className="w-full p-2 border rounded">
                      <option value="true">فعال</option>
                      <option value="false">غیرفعال</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="can-login" />
                  <label htmlFor="can-login" className="text-sm">
                    امکان ورود به سیستم
                  </label>
                </div>
              </div>
            </PermissionGuard>

            {/* دکمه‌های عملیات */}
            <div className="flex gap-2 pt-4">
              <Button type="submit">
                {isEditing ? 'به‌روزرسانی' : 'ایجاد'}
              </Button>
              
              <Button type="button" variant="outline">
                انصراف
              </Button>
              
              {/* دکمه حذف فقط در حالت ویرایش و برای مدیران */}
              {isEditing && (
                <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}>
                  <DeleteButton resource={RESOURCES.INSPECTOR} scope="all" variant="destructive">
                    حذف بازرس
                  </DeleteButton>
                </PermissionGuard>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </ProtectedRoute>
  );
}

// مثال 3: Dashboard با widgets مختلف بر اساس permissions
function AdminDashboard() {
  const { hasPermission } = usePermissions();
  const { isAdmin, isManager } = useRoles();

  return (
    <ProtectedRoute permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.VIEW }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">پنل مدیریت</h1>
          <p className="text-muted-foreground">نمای کلی سیستم مدیریت بازرسی</p>
        </div>

        {/* آمار کلی - همه مدیران */}
        {isManager() && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">156</div>
                <div className="text-sm text-muted-foreground">کل گزارش‌ها</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">23</div>
                <div className="text-sm text-muted-foreground">در انتظار تایید</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">120</div>
                <div className="text-sm text-muted-foreground">تایید شده</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">بازرسان فعال</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ویجت‌های مختلف بر اساس permissions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* مدیریت بازرسان */}
          <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_INSPECTORS }}>
            <Card>
              <CardHeader>
                <CardTitle>مدیریت بازرسان</CardTitle>
                <CardDescription>مدیریت و نظارت بر بازرسان</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    مشاهده همه بازرسان
                  </Button>
                  <CreateButton resource={RESOURCES.INSPECTOR} className="w-full">
                    افزودن بازرس جدید
                  </CreateButton>
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* مدیریت نقش‌ها - فقط Global Admin */}
          <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE_ROLES }}>
            <Card>
              <CardHeader>
                <CardTitle>مدیریت نقش‌ها</CardTitle>
                <CardDescription>تعریف و مدیریت نقش‌های سیستم</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    مشاهده نقش‌ها
                  </Button>
                  <Button className="w-full" variant="outline">
                    ایجاد نقش جدید
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* گزارش‌های PSV */}
          <PermissionGuard permission={{ resource: RESOURCES.PSV, action: ACTIONS.VIEW }}>
            <Card>
              <CardHeader>
                <CardTitle>گزارش‌های PSV</CardTitle>
                <CardDescription>مدیریت گزارش‌های کالیبراسیون PSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    مشاهده گزارش‌ها
                  </Button>
                  {hasPermission(RESOURCES.PSV, ACTIONS.CREATE) && (
                    <CreateButton resource={RESOURCES.PSV} className="w-full">
                      ایجاد گزارش جدید
                    </CreateButton>
                  )}
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>

          {/* تنظیمات سیستم - فقط Global Admin */}
          <PermissionGuard permission={{ resource: RESOURCES.ADMIN, action: ACTIONS.MANAGE }}>
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات سیستم</CardTitle>
                <CardDescription>پیکربندی و تنظیمات کلی</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    تنظیمات عمومی
                  </Button>
                  <Button className="w-full" variant="outline">
                    مدیریت مجوزها
                  </Button>
                  <Button className="w-full" variant="outline">
                    لاگ‌های سیستم
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>
        </div>

        {/* اعلان‌ها و هشدارها */}
        {isAdmin() && (
          <Card>
            <CardHeader>
              <CardTitle>اعلان‌های سیستم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 3 گزارش در انتظار تایید نهایی
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    ℹ️ 2 بازرس جدید اضافه شده‌اند
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

// Export کردن components برای استفاده
export {
  InspectorsListPage,
  InspectorForm,
  AdminDashboard
};