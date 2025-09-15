import {
  transformInspectorToUser,
  transformInspectorToRBACUser,
  extractPermissionsFromToken,
  hasPermission,
  hasRole,
  getFullName,
  isAdmin,
  isManager,
  isInspector,
} from '../auth-utils';

describe('Auth Utils', () => {
  describe('transformInspectorToUser', () => {
    it('should transform backend inspector to frontend User format', () => {
      const backendInspector = {
        id: 1,
        username: 'john.doe',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        employee_id: 'EMP001',
        roles: ['PSV Inspector'],
        active: true,
        can_login: true,
        phone: '+1234567890',
        profile_image_url: '/avatars/john.jpg',
      };

      const user = transformInspectorToUser(backendInspector);

      expect(user).toEqual({
        id: 1,
        username: 'john.doe',
        email: 'john.doe@example.com',
        name: 'John Doe',
        roles: ['PSV Inspector'],
        is_active: true,
        employee_id: 'EMP001',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        profile_image_url: '/avatars/john.jpg',
        active: true,
        can_login: true,
        avatar: '/avatars/john.jpg',
      });
    });

    it('should handle missing optional fields', () => {
      const backendInspector = {
        id: 1,
        username: null,
        email: 'test@example.com',
        employee_id: 'EMP001',
        roles: [],
      };

      const user = transformInspectorToUser(backendInspector);

      expect(user.username).toBeNull();
      expect(user.name).toBe('');
      expect(user.roles).toEqual([]);
      expect(user.is_active).toBe(true); // default value
    });
  });

  describe('transformInspectorToRBACUser', () => {
    it('should transform backend inspector to RBACUser format', () => {
      const backendInspector = {
        id: 1,
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        employee_id: 'EMP002',
        national_id: '1234567890',
        years_experience: 5,
        active: true,
        can_login: true,
        roles: ['NDT Inspector'],
        permissions: ['ndt:create', 'ndt:view'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const rbacUser = transformInspectorToRBACUser(backendInspector);

      expect(rbacUser.id).toBe(1);
      expect(rbacUser.first_name).toBe('Jane');
      expect(rbacUser.last_name).toBe('Smith');
      expect(rbacUser.name).toBe('Jane Smith');
      expect(rbacUser.years_experience).toBe(5);
      expect(rbacUser.roles).toEqual(['NDT Inspector']);
      expect(rbacUser.permissions).toEqual(['ndt:create', 'ndt:view']);
    });
  });

  describe('extractPermissionsFromToken', () => {
    it('should extract permissions from valid JWT token', () => {
      // Create a mock JWT token payload
      const payload = {
        sub: '1',
        roles: ['PSV Inspector'],
        permissions: ['psv:create', 'psv:view'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Create a mock JWT token (header.payload.signature)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = btoa(JSON.stringify(payload));
      const signature = 'mock-signature';
      const token = `${header}.${encodedPayload}.${signature}`;

      const result = extractPermissionsFromToken(token);

      expect(result.roles).toEqual(['PSV Inspector']);
      expect(result.permissions).toEqual(['psv:create', 'psv:view']);
    });

    it('should return empty arrays for invalid token', () => {
      const result = extractPermissionsFromToken('invalid-token');

      expect(result.roles).toEqual([]);
      expect(result.permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', () => {
      const permissions = ['psv:create', 'psv:view', 'ndt:create'];
      
      expect(hasPermission(permissions, 'psv', 'create')).toBe(true);
      expect(hasPermission(permissions, 'ndt', 'create')).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      const permissions = ['psv:create', 'psv:view'];
      
      expect(hasPermission(permissions, 'psv', 'delete')).toBe(false);
      expect(hasPermission(permissions, 'ndt', 'create')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the role', () => {
      const roles = ['PSV Inspector', 'NDT Inspector'];
      
      expect(hasRole(roles, 'PSV Inspector')).toBe(true);
      expect(hasRole(roles, 'NDT Inspector')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      const roles = ['PSV Inspector'];
      
      expect(hasRole(roles, 'Global Admin')).toBe(false);
      expect(hasRole(roles, 'NDT Inspector')).toBe(false);
    });
  });

  describe('getFullName', () => {
    it('should combine first and last name', () => {
      expect(getFullName('John', 'Doe')).toBe('John Doe');
    });

    it('should handle missing first name', () => {
      expect(getFullName(undefined, 'Doe')).toBe('Doe');
    });

    it('should handle missing last name', () => {
      expect(getFullName('John', undefined)).toBe('John');
    });

    it('should return default for missing names', () => {
      expect(getFullName(undefined, undefined)).toBe('Unknown User');
      expect(getFullName('', '')).toBe('Unknown User');
    });
  });

  describe('Role checking utilities', () => {
    it('should identify admin roles', () => {
      expect(isAdmin(['Global Admin'])).toBe(true);
      expect(isAdmin(['System Admin'])).toBe(true);
      expect(isAdmin(['PSV Inspector'])).toBe(false);
    });

    it('should identify manager roles', () => {
      expect(isManager(['Mechanical Manager'])).toBe(true);
      expect(isManager(['PSV Manager'])).toBe(true);
      expect(isManager(['PSV Inspector'])).toBe(false);
    });

    it('should identify inspector roles', () => {
      expect(isInspector(['PSV Inspector'])).toBe(true);
      expect(isInspector(['NDT Inspector'])).toBe(true);
      expect(isInspector(['Global Admin'])).toBe(false);
    });
  });
});