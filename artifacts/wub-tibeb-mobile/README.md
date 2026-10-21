# Wub Tibeb · iOS and Android

**ውብ ጥበብ — Wear. Share. Repeat.**

A native-first Expo app for the Wub Tibeb Habesha kemis exchange community. The iOS and Android app uses the same Clerk accounts, PostgreSQL-backed API, listing photos, matches, conversations, and exchange history as the website.

## Development preview

The app is configured as an Expo artifact. Start the managed workflow named `artifacts/wub-tibeb-mobile: expo`, then use Replit's **Preview on your phone** flow to open it with Expo Go. The normal workspace preview is also available for the responsive web build.

## Core flows

- Amharic-first interface with an English switch
- Clerk email/password sign-up with email verification and Google sign-in
- Private member profile and preferred garment measurements in centimeters
- Search and filter active kemis listings, with optional size compatibility
- Left/pass and right/like swipes; every like selects one active dress from the member's wardrobe
- Compressed multi-photo listing creation and editing through the existing signed-upload API
- Reciprocal garment-specific matches, private messaging, proposal acceptance, and bilateral completion
- Reports, blocks, in-app notifications, and moderator review for admin accounts
- First-time guidance and the existing public tutorial clips

There are no payments or SMS-code sign-in flows. Authentication uses the configured Clerk email and supported social sign-in methods.

## Shared services

The app calls the existing Express API through the generated `@workspace/api-client-react` client. Bearer tokens come from the native Clerk session; private measurements remain on the profile API and are not exposed on public listings. Photo uploads use signed object-storage URLs, then the listing API validates ownership, file type, and size.

## Publishing

This workspace contains the app source and Expo preview configuration. Store submission, app signing, and final store metadata still require the publisher's review and credentials. The app's bundle identifiers are set in `app.json` and should not be changed after the first store build.
