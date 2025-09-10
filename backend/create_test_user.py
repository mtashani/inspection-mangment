#!/usr/bin/env python3
"""
Script to create a test user for debugging login issues
"""

import sqlite3
import hashlib
from datetime import datetime
import json
import bcrypt

# Simple password hashing using bcrypt directly
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_test_user():
    conn = sqlite3.connect('inspection_management.db')
    cursor = conn.cursor()

    # Create a new user
    username = 'testuser'
    password = 'test123'
    password_hash = hash_password(password)

    try:
        cursor.execute('''
            INSERT INTO inspectors (
                first_name, last_name, employee_id, national_id, inspector_type, 
                email, phone, department, education_degree, education_field, 
                education_institute, graduation_year, years_experience, specialties, 
                previous_companies, active, username, password_hash, can_login, 
                created_at, updated_at, attendance_tracking_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'Test', 'User', 'TEST-001', '9876543210', 'General',
            'test@example.com', '+989123456789', 'Operations', 'Bachelor', 'Engineering',
            'University', 2020, 5, json.dumps(["Mechanical"]),
            json.dumps([]), 1, username, password_hash, 1,
            datetime.now(), datetime.now(), 0
        ))
        
        user_id = cursor.lastrowid
        print(f'✅ Created user: {username} with ID: {user_id}')
        
        # Check if inspector role exists, create if not
        cursor.execute('SELECT id FROM roles WHERE name = ?', ('inspector',))
        role = cursor.fetchone()
        
        if not role:
            # Create inspector role
            cursor.execute('INSERT INTO roles (name, description) VALUES (?, ?)', 
                         ('inspector', 'Standard Inspector Role'))
            role_id = cursor.lastrowid
            print(f'✅ Created inspector role with ID: {role_id}')
        else:
            role_id = role[0]
            print(f'✅ Found existing inspector role with ID: {role_id}')
        
        # Check if inspector_roles table exists
        try:
            cursor.execute('INSERT INTO inspector_roles (inspector_id, role_id) VALUES (?, ?)', 
                         (user_id, role_id))
            print(f'✅ Assigned inspector role to user')
        except Exception as e:
            print(f'⚠️ Role assignment failed (table may not exist): {e}')
        
        conn.commit()
        print(f'\n🎉 New user created successfully!')
        print(f'Username: {username}')
        print(f'Password: {password}')
        print(f'Status: Active, Can Login')
        
        # Verify the user was created
        cursor.execute('SELECT username, active, can_login FROM inspectors WHERE username = ?', (username,))
        user = cursor.fetchone()
        if user:
            print(f'✅ Verification: User {user[0]} - Active: {user[1]} - Can Login: {user[2]}')
        
    except Exception as e:
        print(f'❌ Failed to create user: {e}')
        conn.rollback()

    conn.close()

if __name__ == "__main__":
    create_test_user()