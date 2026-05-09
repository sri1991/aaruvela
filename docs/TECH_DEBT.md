# Tech Debt

Running log of known shortcuts, follow-ups and deferred work. Add new
items at the top of the relevant section with a short rationale and a
file/line pointer where useful.

## Donations

### Razorpay integration for donation verification

**Status**: open
**Introduced**: `claude/fix-donations-table` (`c0303fc`)
**Files**: `backend/app/donations/routes.py`, `src/pages/Donations.jsx`

Donations are still UPI-with-manual-reconciliation: the donor pastes a
UTR/UPI reference, the row enters `PENDING`, and a `HEAD` admin verifies
it against the bank statement before an `INCOME / DONATION` ledger
transaction is created.

When Razorpay is integrated, the verify flow can be replaced by a
webhook handler that flips the donation to `VERIFIED` automatically
using the gateway signature. The admin verify endpoint should remain as
a manual fallback for donations made out-of-band.

**Done when:**
- Razorpay order is created on `POST /donations` and returned to the
  client to launch checkout.
- A signed webhook endpoint validates `payment.captured` events,
  marks the matching donation `VERIFIED`, and inserts the ledger
  transaction in a single transaction.
- Manual `verify`/`reject` endpoints are kept but only used for
  out-of-band UPI donations.
