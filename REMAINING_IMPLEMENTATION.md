# Remaining Implementation Plan

Features that are designed but **not yet implemented**.

---

## Phase 3: Server-Side Betting 🎰

Currently bets are stored locally. Need to move to server.

### Files to Modify

| File                                         | Changes                                 |
| -------------------------------------------- | --------------------------------------- |
| `server.js`                                  | Handle `bet` messages, store in MongoDB |
| `lib/db.ts`                                  | Add bet CRUD functions                  |
| `hooks/useWebSocket.ts`                      | Send bet data to server                 |
| `components/roulette/LiveRouletteGameV2.tsx` | Remove local bet calculation            |

### Implementation Steps

```
1. [ ] Add bet storage functions to db.ts
   - saveBet(roundNumber, username, betType, amount, targetNumber?)
   - getBetsByRound(roundNumber)
   - getBetsByUser(username)

2. [ ] Update server.js to handle bets
   - On 'bet' message: validate & store in MongoDB
   - On result phase: calculate winners, update user balance
   - Broadcast bet confirmations to sender

3. [ ] Update LiveRouletteGameV2.tsx
   - Remove local bet result calculation
   - Show bets from server response
   - Update balance from server

4. [ ] Add global bets display
   - Show all users' bets for current round
   - Highlight winning bets on result
```

---

## Phase 4: Chat Persistence 💬

Currently chat is ephemeral. Need MongoDB storage.

### Files to Modify

| File                               | Changes                                        |
| ---------------------------------- | ---------------------------------------------- |
| `server.js`                        | Store chat in MongoDB, load history on connect |
| `lib/db.ts`                        | Chat CRUD with FIFO limit                      |
| `components/roulette/LiveChat.tsx` | Edit support, reply UI                         |

### Implementation Steps

```
1. [ ] Update server.js for chat persistence
   - On 'chat' message: store in MongoDB (10k FIFO limit)
   - On client connect: send last 100 messages
   - Broadcast new messages to all clients

2. [ ] Add edit message feature
   - Max 5 edits per message
   - Show "edited" indicator in UI
   - Store editedAt timestamp

3. [ ] Add reply feature
   - Store replyToId field
   - Show quoted message in UI
```

---

## Phase 5: Auth Integration 🔐

Currently using demo auth. Need real API connection.

### Files to Modify

| File                          | Changes                       |
| ----------------------------- | ----------------------------- |
| `components/ui/AuthModal.tsx` | Call real API endpoints       |
| `hooks/useWebSocket.ts`       | Send JWT token for auth       |
| `server.js`                   | Verify JWT, load user from DB |

### Implementation Steps

```
1. [ ] Update AuthModal to use real endpoints
   - POST /api/auth/register for signup
   - POST /api/auth/login for login
   - Store JWT in localStorage

2. [ ] Update WebSocket auth
   - Send JWT in authenticate message
   - Server verifies and loads user from DB

3. [ ] Add session management
   - Check token validity on page load
   - Auto-logout on token expiry
```

---

## Priority Order

1. **Phase 3** - Server betting (core feature)
2. **Phase 5** - Real auth (security)
3. **Phase 4** - Chat persistence (nice to have)

---

## Database Collections Status

| Collection | Schema | CRUD Functions | Used in App      |
| ---------- | ------ | -------------- | ---------------- |
| `users`    | ✅     | ✅             | ⏳ Demo only     |
| `chat`     | ✅     | ✅             | ❌ Not connected |
| `rounds`   | ✅     | ⏳             | ❌ Not connected |
| `bets`     | ✅     | ⏳             | ❌ Not connected |
