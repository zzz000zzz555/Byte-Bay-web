# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: people shopping on Byte Bay from phones, tablets, laptops, or desktop computers.
- Secondary: authorized Byte Bay staff managing the store from the administration panel.

## Product Purpose

Byte Bay is a Peruvian online store for browsing a multi-category catalog, placing orders, and managing store operations.

## Positioning

The current implementation brings the public catalog, customer checkout, and staff operations into one web product. A distinctive market position has not been established.

## Operating Context

- Customers browse and filter products, inspect product details, use a cart, sign in, and submit orders.
- Staff sign in to a role-restricted panel to manage products, inventory, offers, orders, customers, and other store operations.
- The application is implemented as HTML, CSS, and JavaScript with Supabase-backed catalog and workflows.

## Capabilities and Constraints

- Existing customer functions include product browsing, search and filters, product details and comments, recommendations, cart, account, order tracking, and checkout.
- Existing checkout integrations are Culqi and Mercado Pago. Payment confirmation must continue to rely on the payment provider; never simulate an approved transaction.
- The administration panel includes role-based access and operational sections for catalog, inventory, offers, orders, claims, audit, staff, themes, packs, and reporting.
- Visual work covers the public storefront, customer checkout, and administration panel on phone, tablet, laptop, and desktop sizes.
- The user permits usability-flow changes when necessary but has not requested changes to payment or inventory business rules.
- Seasonal audio is excluded. Honor reduced-motion preferences and provide controls that fully stop optional animation.
- Do not install third-party skills, packages, or copied UI components without verifying their source and compatibility with the current vanilla stack.

## Brand Commitments

- Preserve the Byte Bay name and existing logo assets.
- Interface language: Spanish.
- The user requests a professional, minimalist, easy-to-understand interface that still feels distinctive rather than template-like.

## Evidence on Hand

- `index.html`, `app.js`, and associated CSS contain the customer storefront, cart, product details, and payment-provider selection.
- `admin.html`, `admin.js`, `admin.css`, and `admin-pro.css` contain the staff management panel.
- Supabase Edge Functions and SQL scripts exist for catalog, checkout, inventory, packs, and seasonal themes.
- No confirmed testimonials, independent business metrics, or unique market-position evidence was provided. Do not invent these.

## Product Principles

- Keep product, inventory, and payment state grounded in the existing backend.
- Make shopping and store operations understandable across screen sizes.
- Preserve trust boundaries around payment providers and staff permissions.
- Respect reduced motion and do not play audio without an explicit request.
