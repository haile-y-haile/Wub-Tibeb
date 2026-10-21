---
name: Authentication methods
description: Wub Tibeb's requested email, Google, and real Ethiopia-compatible phone sign-in methods.
---

The user wants Wub Tibeb account creation to offer email, phone, and Google sign-in. Keep email and Google on the existing Clerk setup. Do not show phone sign-in as active until a real SMS provider that can deliver to Ethiopia is configured and verified; never simulate SMS OTP.

**Why:** The user explicitly requested all three methods while the product requires functional authentication rather than fake SMS verification.

**How to apply:** Check Replit-managed Clerk's current provider capabilities before changing auth. For a separate SMS provider, verify Ethiopia delivery, safe identity linking to existing Clerk accounts, and recovery/security behavior before implementation.
