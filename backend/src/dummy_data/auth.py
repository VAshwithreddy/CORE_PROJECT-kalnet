# Dummy data for the Authentication module

DUMMY_USERS_DB = {
    "jdoe": {
        "id": "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
        "username": "jdoe",
        "email": "jdoe@example.com",
        "password": "secret123",
        "role": "employee",
    },
    "admin_user": {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "admin_user",
        "email": "admin@example.com",
        "password": "admin123",
        "role": "super_admin",
    },
}

DUMMY_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.payload"
DUMMY_REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.refresh"
