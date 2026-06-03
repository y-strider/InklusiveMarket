# InclusiveMarket

A minimal Laravel 11 + Blade marketplace scaffold with role-based auth, product catalog, cart/checkout, admin, and PayMongo/Google OAuth stubs. Accessible, WCAG-friendly, and ready for local dev or deployment.

## Quick Start

```bash
git clone https://github.com/y-strider/InklusiveMarket.git
cd inklusivemarket-l11
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run build
php artisan serve
```

## Features

- Buyer/Seller/Admin roles
- Product catalog, cart, checkout, orders
- Admin approvals, seller CRUD
- Google OAuth, PayMongo payment stubs
- Accessible Blade UI (WCAG 2.1 AA)
- Minimal, extensible, and secure

## Notes

- Use your own API keys and secrets in `.env`
- See `build.md` for full blueprint and next steps