# BAAGAY ecommerce

Next.js storefront with Firebase Authentication and Realtime Database; Razorpay checkout; Resend transactional email; and a custom-claim-protected admin.

## Local setup

1. Copy `.env.example` to `.env.local` and fill every Firebase client value.
2. Download a Firebase service-account JSON and set `GOOGLE_APPLICATION_CREDENTIALS` to its absolute path. Alternatively, add its project ID, client email, and private key to the server-only `FIREBASE_ADMIN_*` variables.
3. Add Razorpay test credentials. Set `NEXT_PUBLIC_SITE_URL` to the deployed origin in production.
4. Optionally add Resend credentials and verify the domain used by `RESEND_FROM_EMAIL`.
5. Install and verify:

```sh
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Firebase deployment

Deploy the hardened Realtime Database and Storage rules before inviting customers:

```sh
firebase use YOUR_PROJECT_ID
firebase deploy --only database,storage
```

Product photos are uploaded through `/api/admin/uploads` (Firebase Admin) into the bucket named by `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`; the database keeps only the download URL. If older products still embed photos in the database, the admin page shows a one-click **Move photos to Storage** banner.

Enable Email/Password, Google, and/or Phone providers in Firebase Authentication. Add the deployed domain to Authentication → Settings → Authorized domains.

Grant the first administrator after that user has registered:

```sh
npm run admin:grant -- owner@baagay.in
```

The user must sign out and back in to receive the new custom claim. This is the only way to create an admin: the client never assigns itself a role. Ordinary authenticated customers cannot read leads, campaigns, other customers’ orders, or write catalog data.

## Razorpay

Create a Razorpay webhook pointing to:

```text
https://YOUR_DOMAIN/api/webhooks/razorpay
```

Subscribe to `payment.captured`, `payment.failed`, and `order.paid`, and put the webhook signing secret in `RAZORPAY_WEBHOOK_SECRET`. Use test mode until the complete purchase, refund, and webhook flows have been exercised. Prices, promotions, stock and totals are recalculated server-side; the browser’s cart values are never trusted.

## Operations

- `/admin` manages products, per-size inventory, categories, campaigns, order fulfilment, and Razorpay refunds.
- Seed and category media stays in `public/`; admin-uploaded product photos live in Cloud Storage. Realtime Database stores only path/URL strings, never image or video binaries.
- The storefront uses GSAP (ScrollTrigger, SplitText). All motion respects `prefers-reduced-motion`; product cards open an intercepted-route pop-up (`app/@modal`), while a direct visit to `/products/[slug]` renders the full page.
- Guest carts and wishlists persist locally and merge into private Firebase records after sign-in.
- Stock is only ever changed by relative, transactional updates on the server: orders hold and release it, and the admin's stock buttons and product form go through `/api/admin/products/[id]/stock`, so an admin edit never overwrites pieces held by a checkout in progress. **Seed Firebase** only adds records that don't exist yet.
- Discount campaigns are admin-only in the database. The storefront learns about the single live promotion from `/api/promotion`, so scheduled or private codes are never sent to browsers.
- Checkout, reservation and newsletter requests are rate-limited per IP through counters in Realtime Database (`rateLimits/`), so the limit holds across serverless instances.
- Schedule `GET /api/cron/release-reservations` (e.g. every 10 minutes) with `Authorization: Bearer $CRON_SECRET` so unpaid orders release their stock even when no one else is checking out. On Vercel, set `CRON_SECRET` and add a cron for that path; Vercel sends the header automatically.
- Stock is held when an order is created, so two shoppers cannot buy the last piece. It is released when the shopper closes the payment window or after 30 minutes unpaid (`abandoned`), and returned on cancellation or refund. A late payment for an abandoned order still completes it; if stock ran out meanwhile the order is flagged `stockShortfall`.
- Payment confirmation is idempotent: the browser verification and the webhook can both arrive, in any order, without double-counting stock or emails, and a late webhook never reverts a fulfilled or refunded order.
- Admins are recognised by the `admin` custom claim **or** `users/{uid}/role === "admin"`, both in the database rules and in the API routes.
- `NEXT_PUBLIC_SITE_URL` drives canonical URLs, sitemap, robots, and social metadata.
