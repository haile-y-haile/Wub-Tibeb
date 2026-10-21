---
name: Authentication methods
description: Wub Tibeb authentication scope and safeguards.
---

The user wants Wub Tibeb sign-in/up by email and Google, with phone sign-in/up excluded. Keep Google available for both registration and sign-in. Do not add phone OTP unless the user reverses this decision, and never simulate SMS verification.

**Why:** The user explicitly selected email and Google and dropped phone sign-in/up.

**How to apply:** Keep email/password and Google available in web and mobile flows. Google must also be enabled in the workspace Auth pane; do not present phone sign-in as available.
