# Admin Panel

This directory contains the admin dashboard for managing the roulette game.

## Access

- **Login**: `/auth/admin`
- **Dashboard**: `/admin`
- **Credentials**: `admin` / `mango2024` (change in production!)

## Features

### Dashboard Tab

- Total users count
- Online users (from WebSocket)
- House fund balance
- Today's profit/loss
- Total bets count
- Quick action buttons

### Users Tab

- Search users by username or display name
- View balances (mangos, mango juice, fermented)
- Change user status:
  - `active` - Normal access
  - `timeout` - Temporary restriction
  - `suspended` - Account suspended
  - `banned` - Permanent ban

### Logs Tab

- Filter by level: error, warn, info
- View stack traces for errors
- Auto-cleanup (keeps 24h)

### Settings Tab

- Timer durations (betting, locked, spin, result)
- Bet limits (real/trial)
- House protection threshold

## Security

- Uses `sessionStorage` (not `localStorage`)
- Session expires on browser/tab close
- No persistent admin sessions

## Files

```
app/admin/
└── page.tsx        # Main dashboard component

app/auth/admin/
└── page.tsx        # Login page

app/api/admin/
├── login/route.ts  # Authentication
├── stats/route.ts  # Dashboard stats
├── users/route.ts  # User management
├── logs/route.ts   # Error logs
└── params/route.ts # Game settings
```

## Database Collections

| Collection     | Purpose                  |
| -------------- | ------------------------ |
| `users`        | User accounts & balances |
| `logs`         | Error/warn/info logs     |
| `params`       | Game hyperparameters     |
| `transactions` | Bet history              |
| `rounds`       | Game rounds              |
