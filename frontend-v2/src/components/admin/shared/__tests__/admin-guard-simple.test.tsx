import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test to check if the component can be imported
describe('Admin Permission Guard Import Test', () => {
  it('should be able to import AdminPermissionGuard', async () => {
    const { AdminPermissionGuard } = await import('../admin-permission-guard');
    expect(AdminPermissionGuard).toBeDefined();
    expect(typeof AdminPermissionGuard).toBe('function');
  });

  it('should be able to import AdminOnly', async () => {
    const { AdminOnly } = await import('../admin-permission-guard');
    expect(AdminOnly).toBeDefined();
    expect(typeof AdminOnly).toBe('function');
  });
});