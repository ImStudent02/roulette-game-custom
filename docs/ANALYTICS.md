# User Analytics System

Comprehensive user behavior tracking for gambling research and analysis.

## Overview

This system collects detailed user engagement data to analyze:

- Gambling behavior patterns
- Risk-taking tendencies
- Addiction indicators
- User engagement metrics

**Database**: `R_ANALYTICS_DB` (separate from main game database)

---

## Collections

### 1. `user_events`

Individual user actions/events.

| Field       | Type   | Description         |
| ----------- | ------ | ------------------- |
| `username`  | string | User identifier     |
| `sessionId` | string | Current session ID  |
| `eventType` | string | Type of event       |
| `eventData` | object | Event-specific data |
| `timestamp` | number | Unix timestamp      |
| `page`      | string | Current page path   |
| `device`    | object | Browser/screen info |

### 2. `user_sessions`

User session records.

| Field       | Type   | Description              |
| ----------- | ------ | ------------------------ |
| `sessionId` | string | Unique session ID        |
| `username`  | string | User identifier          |
| `startedAt` | number | Session start time       |
| `endedAt`   | number | Session end time         |
| `summary`   | object | Aggregated session stats |

### 3. `user_stats`

Lifetime aggregated statistics per user.

| Field             | Type   | Description            |
| ----------------- | ------ | ---------------------- |
| `_id`             | string | Username (primary key) |
| `totalSessions`   | number | Lifetime session count |
| `totalTimeSpent`  | number | Total time in ms       |
| `totalBetsPlaced` | number | Lifetime bets          |
| `maxSingleBet`    | number | Highest bet amount     |
| `maxLossStreak`   | number | Worst losing streak    |

---

## Events Collected

### Betting Events

| Event                 | Data Captured                                        |
| --------------------- | ---------------------------------------------------- |
| `bet_placed`          | amount, type, targetNumber, roundNumber, msIntoRound |
| `bet_removed`         | amount, msBeforeLock, wasLastSecond, roundNumber     |
| `bet_chip_selected`   | chipValue, previousChip                              |
| `all_in_clicked`      | balance, maxBet                                      |
| `max_bet_hit`         | attemptedAmount, actualMax                           |
| `round_participated`  | betCount, totalWagered, currencyMode                 |
| `round_skipped`       | roundNumber, hadBalance                              |
| `round_result_viewed` | won, amount, viewDurationMs                          |

### Page & Navigation Events

| Event           | Data Captured                  |
| --------------- | ------------------------------ |
| `page_view`     | page, referrer                 |
| `page_exit`     | page, timeSpentMs, scrollDepth |
| `tab_switch`    | fromTab, toTab                 |
| `section_focus` | section                        |
| `section_blur`  | section, durationMs            |

### Top-up Flow Events

| Event               | Data Captured                 |
| ------------------- | ----------------------------- |
| `topup_page_opened` | fromPage, balance             |
| `pack_viewed`       | packId, packPrice, viewTimeMs |
| `pack_selected`     | packId, packPrice, packMangos |
| `payment_started`   | packId, method                |
| `payment_completed` | packId, timeTakenMs           |
| `payment_failed`    | packId, error                 |
| `topup_bounced`     | timeOnPage, packsViewed       |

### Chat Events

| Event               | Data Captured                     |
| ------------------- | --------------------------------- |
| `chat_opened`       | messageCount                      |
| `chat_message_sent` | charCount, hasEmoji, timeTypingMs |
| `chat_scrolled`     | direction                         |

### Session Events

| Event               | Data Captured             |
| ------------------- | ------------------------- |
| `session_start`     | device info               |
| `session_heartbeat` | every 30s, isActive, page |
| `tab_visible`       | timestamp                 |
| `tab_hidden`        | timestamp                 |
| `session_end`       | reason, totalDurationMs   |

### Behavioral Pattern Events

| Event               | Data Captured                 |
| ------------------- | ----------------------------- |
| `hover_element`     | element, durationMs           |
| `rage_click`        | element, clickCount           |
| `hesitation`        | element, hoverTimeBeforeClick |
| `currency_switched` | from, to                      |

---

## How Data is Collected

### Client-Side (React Hook)

```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

const { track } = useAnalytics({
  username: user.username,
  enabled: isAuthenticated,
});

// Track events
track.betPlaced({ amount, type, roundNumber, msIntoRound });
track.betRemoved({ amount, msBeforeLock, wasLastSecond });
track.currencySwitched("trial", "real");
```

### Batching

Events are queued locally and sent in bulk to reduce API calls:

| Setting             | Value      | Description                        |
| ------------------- | ---------- | ---------------------------------- |
| Batch Size          | 60 events  | Flush when queue reaches 60        |
| Flush Interval      | 15 seconds | Send pending events every 15s      |
| Heartbeat           | 60 seconds | Session keep-alive ping            |
| localStorage Backup | ✅         | Pending events survive page reload |

- Events stored in `eventQueueRef` (memory) + `analyticsEventQueue` (localStorage)
- On page unload: Sync flush via `navigator.sendBeacon`
- On page reload: Pending events restored from localStorage

### Session Management

- Session ID stored in `sessionStorage`
- Heartbeat sent every 60 seconds
- Session ends on logout or browser close

---

## API Endpoints

| Endpoint                    | Method | Purpose            |
| --------------------------- | ------ | ------------------ |
| `/api/analytics/events`     | POST   | Batch log events   |
| `/api/analytics/session`    | POST   | Start/end session  |
| `/api/analytics/heartbeat`  | POST   | Update last active |
| `/api/admin/user-analytics` | GET    | Admin data access  |

---

## Admin Dashboard

**URL**: `/admin/analytics`

### Features

- **User List**: Sortable by time spent, bets, wagered amount
- **Search**: Find users by username
- **Detail View**: Click user to see:
  - Lifetime statistics
  - Risk indicators (loss streaks, max bets)
  - Recent sessions with duration
  - Full event timeline

---

## Risk Indicators

These metrics help identify problematic gambling behavior:

| Indicator               | Description                       |
| ----------------------- | --------------------------------- |
| `maxSingleBet`          | Highest amount wagered in one bet |
| `maxLossStreak`         | Most consecutive losses           |
| `betRemovalRate`        | % of bets cancelled before spin   |
| `lastSecondRemovalRate` | % of removals in final 5 seconds  |
| `skipRate`              | % of rounds skipped vs played     |

---

## Files

| File                                    | Purpose                    |
| --------------------------------------- | -------------------------- |
| `lib/analytics.ts`                      | Database operations, types |
| `hooks/useAnalytics.ts`                 | React hook for tracking    |
| `app/api/analytics/events/route.ts`     | Event logging API          |
| `app/api/analytics/session/route.ts`    | Session management         |
| `app/api/analytics/heartbeat/route.ts`  | Keep-alive                 |
| `app/api/admin/user-analytics/route.ts` | Admin API                  |
| `app/admin/analytics/page.tsx`          | Admin dashboard            |

---

## Privacy Considerations

- All data is stored locally (not shared externally)
- Purpose: Research on gambling behavior
- No personally identifiable information beyond username
- Device info limited to browser/screen size
