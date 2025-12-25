# Daily Claim System

Rewards users with free trial currency every 24 hours.

## Features

- **Base reward**: 100 Fermented Mangos
- **Streak bonus**: +10% per consecutive day (max 7 days = +70%)
- **Auto popup**: Appears on `/live` when reward available
- **24-hour cooldown**: Resets when claimed

## Streak Bonus Table

| Day | Bonus | Total Reward |
| --- | ----- | ------------ |
| 1   | +0%   | 100          |
| 2   | +10%  | 110          |
| 3   | +20%  | 120          |
| 4   | +30%  | 130          |
| 5   | +40%  | 140          |
| 6   | +50%  | 150          |
| 7+  | +60%  | 160          |

## API

### Check Status

`GET /api/daily-claim`

```json
{
  "canClaim": true,
  "hoursUntilClaim": 0,
  "rewardAmount": 100,
  "streak": 3
}
```

### Claim Reward

`POST /api/daily-claim`

```json
{
  "success": true,
  "reward": 130,
  "streak": 4,
  "bonusPercent": 30,
  "message": "🎁 Claimed 130 Fermented Mangos! (4 day streak!)"
}
```

## Database Fields

Added to `UserDocument`:

- `lastDailyClaimAt`: Timestamp of last claim
- `dailyStreak`: Consecutive days claimed

## Files

- `app/api/daily-claim/route.ts` - API endpoint
- `components/ui/DailyClaimPopup.tsx` - Popup component
- `lib/db.ts` - Type definitions
