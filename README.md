# Leddar — Admin Panel

The internal admin web application for the Leddar premium leather production platform. Admins manage the full order lifecycle: assign jobs, review videos, release payments, and configure commission settings.

**URL:** http://localhost:3006

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| HTTP Client | Axios |
| Notifications | React Hot Toast |
| Date Formatting | Moment.js |

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3006 |
| `npm run build` | Build for production |
| `npm start` | Start production server on port 3006 |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Project Structure

```
pages/
├── dashboard.jsx              # Overview stats and pipeline summary
├── jobs.jsx                   # Job assignment, video review, order management
├── brands.jsx                 # Brand list and KYC status
├── artisans.jsx               # Artisan list and KYC / availability
├── quotes.jsx                 # All quote requests
├── orders/
│   └── orders.jsx             # Order list with status filters
├── payments.jsx               # Escrow release: Stage 1 + Stage 2 to artisans
├── payment-history.jsx        # Full payment audit trail
├── commission-settings.jsx    # Commission rates + acceptance windows
└── notifications.jsx          # Platform-wide notification log

services/
├── apiClient.js               # Axios instance with JWT interceptors
├── adminService.js            # Job assignment, artisan/brand management
├── commissionService.js       # Commission settings read/write + calculation helpers
└── escrowService.js           # Payment release API calls

store/
└── slices/
    └── authSlice.js
```

---

## Key Responsibilities

### Job Assignment (`/jobs`)

- **Needs Assignment tab** — sample orders in `FLAT_FEE_PAID` status; production orders in `IN_PRODUCTION` status (only after brand pays)
- **Active Jobs tab** — jobs currently in progress
- **Sample Ready tab** — jobs with video uploaded, awaiting review

Artisans can only be assigned a sample job if their **NIN is verified**. Production jobs only appear after the brand has paid the production balance.

### Video Review

**Sample video:**
- Approve → video is forwarded to the brand for their review
- Reject → artisan is notified to re-upload; video placeholder shown

**Production video:**
- Approve → order advances to `PENDING_DELIVERY`
- Reject → artisan re-uploads; reject button hidden permanently after approval

### Escrow & Payments (`/payments`)

Admin releases artisan payments in two stages:

| Stage | Trigger | What it pays |
|---|---|---|
| Stage 1 — Materials | After artisan accepts production job | Artisan's raw materials share |
| Stage 2 — Service Fee | After job status is `DELIVERED` or `COMPLETED` | Artisan's service fee share |

Rates are pulled from the snapshotted values on each order (`snapshotStage1Rate`, `snapshotStage2Rate`) — not live commission settings. This means changing commission rates after an order is placed has no effect on that order's payouts.

### Commission Settings (`/commission-settings`)

| Setting | Description |
|---|---|
| Admin Rate | Admin's cut from production payments |
| Artisan Stage 1 Rate | Materials payment share |
| Artisan Stage 2 Rate | Service fee share |
| Sample Admin Rate | Admin's cut from sample flat fee |
| Sample Acceptance Hours | Hours artisan has to accept a sample job |
| Production Acceptance Hours | Hours artisan has to accept a production job |

Rates are stored as decimals (`0.40`) and displayed as percentages. New rates apply only to orders created after the change.

---

## Order Lifecycle (Admin Actions)

```
Brand pays sample fee
        ↓
Admin assigns sample job → artisan must have NIN verified
        ↓
Artisan uploads sample video
        ↓
Admin reviews video:
  ✓ Approve  → forwarded to brand
  ✗ Reject   → artisan re-uploads
        ↓
Brand approves sample
        ↓
Admin marks sample complete → production order created (SUBMITTED)
Admin inputs production pricing
        ↓
Brand pays production balance → order becomes IN_PRODUCTION
        ↓
Production job auto-assigned to same artisan
        ↓
Admin releases Stage 1 (materials) payment
        ↓
Artisan completes production → uploads video
        ↓
Admin reviews production video → approves
        ↓
Admin marks Pending Delivery → Dispatched → Delivered
        ↓
Admin releases Stage 2 (service fee) payment  ← available on DELIVERED or COMPLETED
```

---

## Webhooks (Server Side)

The admin panel communicates via the API. The server handles two inbound webhooks automatically — no admin configuration needed beyond the initial setup below.

### Paystack Webhook
Handles `charge.success` events. Auto-advances order status and creates escrow record when a brand pays.

Configure once in **Paystack dashboard → Settings → Webhooks**:
```
https://api.myleddar.com/api/v1/payments/webhook
```

### QoreID Address Verification Webhook
Handles async physical address verification results for artisans. Updates artisan `addressStatus` when QoreID finishes a site visit.

Configure once in **QoreID dashboard → Webhooks → Configuration**:
```
Live:  https://api.myleddar.com/api/v1/webhooks/qoreid
Test:  https://<ngrok-url>/api/v1/webhooks/qoreid   (see server README for ngrok setup)
```

Enable **Network Downtime Handling** in QoreID so requests are queued during NIMC outages.

---

## Testing

### Test Structure

```
__tests__/
└── services/
    ├── authService.test.js      # Login, logout, session persistence, token refresh
    └── paymentsService.test.js  # Escrow status mapping, stage release, payout history,
                                 #   artisan receipt download, admin earnings error fallback
```

### Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npx jest __tests__/services/paymentsService.test.js

# Run tests matching a name pattern
npx jest --testNamePattern="escrowStatus"

# Watch mode (re-runs on file change)
npx jest --watch
```

Tests run in **jsdom** environment with **babel-jest**. The `apiClient` Axios instance is mocked — no real API calls are made. `localStorage` is provided by `jest.setup.js`.

---

## Pages Reference

| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Platform overview and pipeline counts |
| Jobs | `/jobs` | Job assignment, video review, order modal |
| Brands | `/brands` | Brand list, KYC status, account management |
| Artisans | `/artisans` | Artisan list, availability, KYC status |
| Quotes | `/quotes` | All quote requests with status |
| Orders | `/orders` | Full order list with filters |
| Payments | `/payments` | Release Stage 1 / Stage 2 to artisans |
| Payment History | `/payment-history` | Full audit trail of all payments |
| Commission Settings | `/commission-settings` | Rates + acceptance windows |
| Notifications | `/notifications` | Platform notification log |
