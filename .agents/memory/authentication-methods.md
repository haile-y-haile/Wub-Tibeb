---
name: Authentication methods
description: Wub Tibeb authentication scope and safeguards.
---

The user has dropped phone sign-in/up for Wub Tibeb and wants email sign-in. Google sign-in was requested earlier; clarify whether to retain it if the user asks for email-only. Do not add phone OTP unless the user reverses this decision, and never simulate SMS verification.

**Why:** The user changed the app's auth scope to email and dropped phone sign-in/up.

**How to apply:** Keep the current email/password flow. Before removing or changing Google sign-in, confirm whether email-only is intended.
