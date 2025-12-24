# Admin API Routes

Backend API endpoints for the admin panel.

## Authentication

### POST `/api/admin/login`

Login to admin panel.

```json
// Request
{ "username": "admin", "password": "mango2024" }

// Response
{ "success": true, "token": "base64token..." }
```

## Endpoints

### GET `/api/admin/stats`

Returns dashboard statistics from MongoDB.

```json
{
  "totalUsers": 156,
  "onlineUsers": 12,
  "houseFund": 50000000,
  "todayProfit": 1250,
  "totalBets": 8943
}
```

---

### GET `/api/admin/users`

List users with optional search.

**Query Params:**

- `search` - Filter by username/displayName
- `limit` - Max results (default: 50)

```json
{
  "users": [
    {
      "id": "user_id",
      "username": "player1",
      "displayName": "Lucky Player",
      "status": "active",
      "mangos": 15000,
      "mangoJuice": 2500,
      "fermentedMangos": 100000,
      "lastActive": "2 min ago"
    }
  ]
}
```

### PATCH `/api/admin/users`

Update user status.

```json
// Request
{ "userId": "username_or_id", "status": "banned" }

// Response
{ "success": true }
```

**Valid statuses:** `active`, `timeout`, `suspended`, `banned`

---

### GET `/api/admin/logs`

Retrieve error/warning/info logs.

**Query Params:**

- `level` - Filter: `all`, `error`, `warn`, `info`
- `limit` - Max results (default: 100)

```json
{
  "logs": [
    {
      "id": "log_id",
      "timestamp": "12/24/2024, 9:30:45 PM",
      "level": "error",
      "message": "WebSocket connection failed",
      "stack": "Error: timeout\n    at line:123"
    }
  ]
}
```

### POST `/api/admin/logs`

Add a new log entry (for server-side error logging).

```json
{ "level": "error", "message": "Something failed", "stack": "..." }
```

### DELETE `/api/admin/logs`

Clear logs older than 24 hours.

---

### GET `/api/admin/params`

Get current game parameters.

```json
{
  "bettingDuration": 210,
  "lockedDuration": 30,
  "spinDuration": 15,
  "resultDuration": 45,
  "maxBetReal": 100000,
  "maxBetTrial": 1000000,
  "protectionThreshold": 0.5
}
```

### POST `/api/admin/params`

Update game parameters (with validation).

```json
// Request - same fields as GET response
// Response
{ "success": true, "params": { ... } }
```

## Adding to Server Logging

To log errors from `server-v2.js`:

```javascript
async function logError(message, stack) {
  try {
    await fetch("http://localhost:3000/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: "error", message, stack }),
    });
  } catch (e) {
    console.error(e);
  }
}
```
