# Withdraw Flow

Allows users to convert Mango Juice winnings to real money.

## Pages

| Page                | Description                           |
| ------------------- | ------------------------------------- |
| `/withdraw`         | Amount selection with balance display |
| `/withdraw/process` | Payment method form + confirmation    |

## Flow

1. **Profile** → Click Mango Juice card (shows "Withdraw →" on hover)
2. **Withdraw** → Enter amount, see USD preview
3. **Process** → Select PayPal or Bank, confirm
4. **Success** → Redirects to profile

## Features

- Balance display with USD value
- Quick select buttons (1K, 10K, 50K, 100K, MAX)
- Real-time USD conversion
- Minimum 100 juice validation
- PayPal email or Bank details form

## API

`POST /api/wallet/withdraw`

```json
{
  "amount": 10000
}
```

Response:

```json
{
  "success": true,
  "withdrawal": {
    "mangoJuice": 10000,
    "usdValue": 10,
    "displayValue": "$10.00"
  },
  "newBalance": 5000,
  "message": "💵 Successfully withdrew 10,000 Mango Juice ($10.00 USD)"
}
```

## Rate

**1,000 Mango Juice = $1.00 USD**

## Files

- `app/withdraw/page.tsx` - Amount selection
- `app/withdraw/process/page.tsx` - Payment form
- `app/api/wallet/withdraw/route.ts` - API endpoint
