# Users API Documentation

## Overview
The Users API provides CRUD operations for user profiles stored in Firebase Firestore. Each user profile is linked to a Firebase Auth user via their `uid`.

## Profile Type
```typescript
type Profile = {
  id: string;        // Firebase Auth UID
  name: string;      // User's display name
  age: number;       // User's age
  image: string | null; // Profile image URL
  tags: string[];    // Array of sports/interests (e.g., ["basquete", "futebol"])
};
```

## Endpoints

### 1. Create User Profile
**POST** `/users`

Creates a new user profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <idToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "João Silva",
  "age": 25,
  "image": "https://example.com/photo.jpg",
  "tags": ["basquete", "futebol", "vôlei"]
}
```

**Response:**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "image": "https://example.com/photo.jpg",
  "tags": ["basquete", "futebol", "vôlei"]
}
```

### 2. Get All Users (with filtering)
**GET** `/users`

Retrieves all user profiles with optional filtering.

**Query Parameters:**
- `tag` (string): Filter users who have this specific tag
- `tagsAny` (string or array): Filter users who have any of these tags
- `minAge` (number): Minimum age filter
- `maxAge` (number): Maximum age filter
- `name` (string): Exact name match

**Examples:**

Get all users:
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users"
```

Filter by single tag:
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users?tag=basquete"
```

Filter by multiple tags (users who like ANY of these sports):
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users?tagsAny=basquete,futebol"
```

Filter by age range:
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users?minAge=20&maxAge=30"
```

Filter by name:
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users?name=João Silva"
```

Combined filters:
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users?tag=basquete&minAge=18&maxAge=25"
```

**Response:**
```json
[
  {
    "id": "firebase-uid-123",
    "name": "João Silva",
    "age": 25,
    "image": "https://example.com/photo.jpg",
    "tags": ["basquete", "futebol"]
  },
  {
    "id": "firebase-uid-456",
    "name": "Maria Santos",
    "age": 22,
    "image": null,
    "tags": ["basquete", "vôlei"]
  }
]
```

### 3. Get User by ID
**GET** `/users/:id`

Retrieves a specific user profile by their Firebase UID.

**Example:**
```bash
curl "http://localhost:5001/tcc-gameon/us-central1/api/users/firebase-uid-123"
```

**Response:**
```json
{
  "id": "firebase-uid-123",
  "name": "João Silva",
  "age": 25,
  "image": "https://example.com/photo.jpg",
  "tags": ["basquete", "futebol"]
}
```

### 4. Get My Profile
**GET** `/users/me`

Retrieves the authenticated user's own profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <idToken>
```

**Example:**
```bash
curl -H "Authorization: Bearer test-token" \
  "http://localhost:5001/tcc-gameon/us-central1/api/users/me"
```

### 5. Update My Profile
**PATCH** `/users/me`

Updates the authenticated user's own profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <idToken>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "João Silva Updated",
  "age": 26,
  "image": "https://example.com/new-photo.jpg",
  "tags": ["basquete", "futebol", "tênis"]
}
```

**Example:**
```bash
curl -X PATCH \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"age": 26, "tags": ["basquete", "futebol", "tênis"]}' \
  "http://localhost:5001/tcc-gameon/us-central1/api/users/me"
```

### 6. Update User by ID
**PATCH** `/users/:id`

Updates a specific user profile by ID. Requires authentication.

**Headers:**
```
Authorization: Bearer <idToken>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "age": 27,
  "tags": ["basquete"]
}
```

### 7. Delete User
**DELETE** `/users/:id`

Deletes a user profile. Requires authentication.

**Headers:**
```
Authorization: Bearer <idToken>
```

**Example:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer test-token" \
  "http://localhost:5001/tcc-gameon/us-central1/api/users/firebase-uid-123"
```

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "path": "age",
      "message": "Age must be a positive integer"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "No authorization token provided"
}
```

### 404 Not Found
```json
{
  "message": "Profile not found"
}
```

## Notes

- All authenticated endpoints require a valid Firebase ID token in the `Authorization` header
- For local testing, you can use `test-token` as the bearer token
- The `tags` field supports sports names like "basquete", "futebol", "vôlei", etc.
- Profile images should be valid URLs
- Age must be a positive integer
- The `id` field is automatically set to the Firebase Auth UID and cannot be changed
