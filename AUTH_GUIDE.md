# Authentication Guide

## Quick Reference

### For Frontend Developers

#### 1. Login Flow
```javascript
// Login request
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();

if (response.ok) {
  // Store token and user info
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  // Redirect based on role
  if (data.role === 'admin') {
    window.location.href = '/admin/admin-dashboard.html';
  } else {
    window.location.href = '/index.html';
  }
} else {
  alert(data.message);
}
```

#### 2. Registration Flow
```javascript
// Register request
const response = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user' // or 'admin'
  })
});

const data = await response.json();

if (response.ok) {
  // For regular users and first admin, token is returned
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = '/index.html';
  } else {
    // Admin registration pending approval
    alert(data.message);
    window.location.href = '/login.html';
  }
} else {
  alert(data.message);
}
```

#### 3. Making Authenticated Requests
```javascript
// Get token from storage
const token = localStorage.getItem('token');

// Make authenticated request
const response = await fetch('/api/news', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'News Title',
    content: 'News content...'
  })
});

// Handle response
if (response.status === 401) {
  // Token expired or invalid
  alert('Session expired. Please login again.');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
} else if (response.ok) {
  const data = await response.json();
  console.log('Success:', data);
} else {
  const error = await response.json();
  alert(error.message);
}
```

#### 4. Logout Flow
```javascript
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}
```

#### 5. Check Authentication Status
```javascript
function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token && user;
}

function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin';
}

// Protect admin pages
if (!isAuthenticated() || !isAdmin()) {
  window.location.href = '/login.html';
}
```

---

## Protected Routes

### Admin Only Routes
All these routes require `Authorization: Bearer <token>` header and admin role:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/news` | Create news article |
| PUT | `/api/news/:id` | Update news article |
| DELETE | `/api/news/:id` | Delete news article |
| POST | `/api/pdf/upload` | Upload PDF and send newsletter |
| DELETE | `/api/pdf/:id` | Delete PDF |
| POST | `/api/financials/upload` | Upload financial statement |
| DELETE | `/api/financials/:id` | Delete financial statement |
| POST | `/api/upcoming-events` | Create event |
| PUT | `/api/upcoming-events/:id` | Update event |
| DELETE | `/api/upcoming-events/:id` | Delete event |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/messages` | Get all messages |
| DELETE | `/api/messages/:id` | Delete message |
| GET | `/api/admin/pending-admins` | Get pending admin requests |
| PUT | `/api/admin/approve-admin/:id` | Approve admin |

### Public Routes
These routes do not require authentication:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login user |
| GET | `/api/news` | Get all news |
| GET | `/api/news/:id` | Get single news article |
| GET | `/api/pdf` | Get all PDFs |
| GET | `/api/pdf/view/:id` | View PDF |
| GET | `/api/pdf/download/:id` | Download PDF |
| GET | `/api/financials` | Get financial statements |
| GET | `/api/upcoming-events` | Get upcoming events |
| POST | `/api/messages/contact/*` | Submit contact form |
| POST | `/api/subscribe` | Subscribe to newsletter |
| GET | `/api/subscribe` | Get subscribers |

---

## Response Formats

### Successful Login
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### Authentication Error
```json
{
  "message": "Invalid authentication token"
}
```

### Authorization Error
```json
{
  "message": "Admin access required"
}
```

### Validation Error
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Valid email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

---

## Common Issues

### 1. "Authentication required"
- **Cause**: No token sent with request
- **Solution**: Include `Authorization: Bearer <token>` header

### 2. "Invalid authentication token"
- **Cause**: Token expired, invalid, or malformed
- **Solution**: Login again to get a new token

### 3. "Admin access required"
- **Cause**: User is authenticated but not an admin
- **Solution**: Login with admin account

### 4. "Admin approval pending"
- **Cause**: Admin account not yet approved
- **Solution**: Wait for existing admin to approve your account

### 5. "Too many authentication attempts"
- **Cause**: Hit rate limit (10 requests per 15 minutes)
- **Solution**: Wait 15 minutes before trying again

---

## Security Best Practices

### Frontend
1. **Store tokens securely**: Use `localStorage` or `sessionStorage`
2. **Clear tokens on logout**: Always remove tokens when user logs out
3. **Handle token expiration**: Redirect to login when you get 401 responses
4. **Use HTTPS in production**: Never send tokens over HTTP
5. **Don't log tokens**: Never console.log tokens

### Backend
1. **JWT_SECRET**: Must be strong (use `openssl rand -base64 32`)
2. **Token expiration**: Currently set to 7 days
3. **Rate limiting**: 10 login attempts per 15 minutes per IP
4. **Password requirements**: Minimum 6 characters (enforced)
5. **Admin approval**: Second+ admin requires approval

---

## Testing Authentication

### Using cURL
```bash
# Register
curl -X POST http://localhost:5050/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"admin@test.com","password":"admin123","role":"admin"}'

# Login
curl -X POST http://localhost:5050/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Use token (replace YOUR_TOKEN with actual token)
curl -X POST http://localhost:5050/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test News","content":"Test content"}'
```

### Using Postman
1. **Register/Login**: POST to `/api/login`, get token from response
2. **Set Auth Header**: In Headers tab, add:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN`
3. **Make Request**: Send request to protected endpoint

---

## Token Structure

JWT tokens contain:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1698840000,
  "exp": 1699444800
}
```

- `userId`: MongoDB ObjectId of the user
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (7 days from issue)

---

## Admin Approval Workflow

1. **First Admin**: Auto-approved, no wait
2. **Additional Admins**:
   - Register with `role: 'admin'`
   - Account created but `isAdminApproved: false`
   - Cannot login until approved
   - Existing admin visits `/admin/manage-admins.html`
   - Existing admin approves pending admin
   - New admin can now login

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All API routes | 100 requests | 15 minutes |
| Auth routes (/api/register, /api/login) | 10 requests | 15 minutes |

Exceeding limits returns:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Migration Checklist

- [ ] Update all admin pages to send JWT tokens
- [ ] Add login check on admin page load
- [ ] Implement logout functionality
- [ ] Handle 401 responses (redirect to login)
- [ ] Store token on successful login/register
- [ ] Test all admin operations
- [ ] Update any automated scripts/tools
- [ ] Train admins on new login flow
