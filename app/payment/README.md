# Payment Flow

Separate payment page for processing top-up purchases.

## Flow

1. User selects package on `/topup`
2. Clicks **Confirm** button on selected card
3. Redirects to `/payment?package=...&usd=...&mangos=...`
4. User enters card details
5. Submits payment
6. **Success** → Redirect to `/live?topup=success`
7. **Failure** → Redirect to `/topup?error=...`

## Card Validation

| Field       | Rules                                 |
| ----------- | ------------------------------------- |
| Card Number | 16 digits, auto-formatted with spaces |
| Expiry      | MM/YY format, not expired             |
| CVC         | 3-4 digits                            |

## URL Parameters

| Param     | Description                |
| --------- | -------------------------- |
| `package` | Package ID                 |
| `usd`     | USD price                  |
| `mangos`  | Total mangos received      |
| `price`   | Display price (e.g., "$5") |
| `bonus`   | Bonus percentage           |

## Files

```
app/payment/
└── page.tsx    # Payment form with validation

app/topup/
└── page.tsx    # Package selection with Confirm button
```

## Security Notes

- Card details are not stored
- Demo mode - no real payment processing
- Uses Suspense boundary for SSR compatibility

## Connecting Real Payment

Replace the mock API call in `payment/page.tsx`:

```typescript
// Current (demo)
const res = await fetch('/api/wallet/topup', { ... });

// Real integration
const res = await fetch('/api/payment/stripe', {
  method: 'POST',
  body: JSON.stringify({
    packageId,
    cardNumber, // Or use Stripe Elements
    expiry,
    cvc
  })
});
```
