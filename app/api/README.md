# API Routes Directory

## Purpose

This directory contains **Next.js API route handlers** that serve as the backend for the roulette game. All routes use the App Router convention with `route.ts` files.

## Structure

```
api/
├── auth/           # Authentication endpoints
│   ├── login/      # POST: User login
│   ├── register/   # POST: New user registration
│   ├── send-otp/   # POST: Send email OTP
│   └── verify-otp/ # POST: Verify OTP code
│
├── live-game/      # Live multiplayer game state
│   └── route.ts    # GET: Poll current game phase/timer
│
├── user/           # User data endpoints
│   └── route.ts    # GET: Fetch user profile
│
└── wallet/         # Financial operations
    ├── convert/    # POST: Convert between currencies
    ├── topup/      # POST: Add funds (trial/real)
    └── withdraw/   # POST: Withdraw funds
```

## Authentication Flow

1. User registers via `/auth/register`
2. OTP sent to email via `/auth/send-otp`
3. OTP verified via `/auth/verify-otp`
4. Session created via `/auth/login`

## Currency Modes

- **Trial Mode**: Free play currency (1000 starting balance)
- **Real Mode**: Actual currency with deposit/withdrawal

## Related Code

- `lib/auth.ts` - Authentication utilities
- `lib/db.ts` - Database operations
- `lib/dbManager.ts` - Database abstraction layer
- `hooks/useAuth.tsx` - Client-side auth hook
