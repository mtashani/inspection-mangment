import requests

BASE_URL = "http://localhost:8000/api/v1/admin"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"

# 1. Login and get access token
def get_token():
    url = "http://localhost:8000/api/v1/auth/login"
    data = {"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    resp = requests.post(url, data=data)
    resp.raise_for_status()
    return resp.json()["access_token"]

# 2. Get admin user id
def get_admin_user_id(token):
    url = "http://localhost:8000/api/v1/inspectors?limit=100"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    for inspector in resp.json():
        if inspector["username"] == "admin":
            return inspector["id"]
    raise Exception("Admin user not found")

# 3. Get admin role id
def get_admin_role_id(token):
    url = "http://localhost:8000/api/v1/admin/roles"
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        print(f"Error fetching roles: {resp.status_code} {resp.text}")
        resp.raise_for_status()
    for role in resp.json():
        if role["name"] == "admin":
            return role["id"]
    raise Exception("Admin role not found")

# 4. Assign admin role to admin user
def assign_role(token, user_id, role_id):
    url = f"{BASE_URL}/inspectors/{user_id}/roles"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    data = {"role_id": role_id}
    resp = requests.post(url, json=data, headers=headers)
    if resp.status_code == 201:
        print("✅ Admin role assigned to admin user successfully.")
    elif resp.status_code == 400 and "already assigned" in resp.text:
        print("ℹ️ Admin role was already assigned to admin user.")
    else:
        print(f"❌ Failed to assign role: {resp.status_code} {resp.text}")
        resp.raise_for_status()

def main():
    token = get_token()
    user_id = get_admin_user_id(token)
    role_id = get_admin_role_id(token)
    assign_role(token, user_id, role_id)

if __name__ == "__main__":
    main() 