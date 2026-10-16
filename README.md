# Swift POS — Retail POS & Inventory (Demo v0.1)

A modern React/Vite + Node.js/Express demo for stock management and point of sale.

## Features
- Retail dashboard, revenue trend, stock alerts and estimated margins
- Product catalogue with SKU/barcode fields, categories, prices, stock and reorder levels
- Stock adjustments with movement history
- POS cart and cash/M-Pesa/card **simulations**, with inventory deductions
- Sales history, CSV export, interactive thermal-printer animation, browser printing and Save as PDF
- Responsive interface for desktop and mobile

## Run locally
Requirements: Node.js 22+ and npm.
```bash
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```
Open http://localhost:5173 (API at http://localhost:4000/api/health).

## Deploy
- **Vercel**: Import repository, set root directory `client`, framework `Vite`, build `npm run build`, output `dist`. Define Config variable `VITE_API_URL` as the public Render URL (no trailing slash).
- **Render**: Create Node web service with root directory `server`, build `npm install`, start `node index.js`. Optionally set `CORS_ORIGIN` to the exact Vercel frontend origin. API health URL: `/api/health`.

## IMPORTANT — NOT FOR REAL PAYMENTS OR COMMERCIAL USE
This is a demonstration starter. It has **no user authentication, no organization isolation, no PostgreSQL, no taxes/eTIMS, no real payment gateway or banking validation**. All checkout types (including M-Pesa and card) are **simulated**, and the receipts are marked demo. Data is saved to `server/data/demo.json` for local demonstration only and may disappear after Render redeploy or restart. No production financial or tenant/customer data should be stored until a production backend with secure auth, validated monetary accounting, durable database, compliance integrations, and audit controls is implemented.

## Future roadmap
1. PostgreSQL, Prisma, organizations, RBAC, audited immutable stock movements
2. Purchase orders, GRNs, supplier balances, stock transfer and returns
3. Durable transactional checkout with unique idempotency tokens, held/voided sales
4. M-Pesa API integrations with verified callbacks, eTIMS integration
5. Multi-branch, offline-safe POS sync, hardware ESC/POS printer bridge

## Video walkthrough URL (add later)
The **Video Guide** page is already built. It shows a placeholder until you supply your video URL.
To add the link later, set `VITE_VIDEO_URL=https://www.youtube.com/watch?v=YOUR_ID` (or an HTTPS Vimeo URL) in `client/.env` for local development, and as a public **Config** variable in the Vercel frontend project. Redeploy the frontend afterwards. No link is hardcoded and no placeholder video is played.
# swift-pos
