---
name: Expo preview environment
description: Non-blocking Expo SDK 57 development-tool and package-registry behavior in this workspace.
---

Expo can print a missing `libglib-2.0.so.0` error while installing React Native DevTools in this Nix workspace even as Metro continues to serve the app. If Expo Doctor flags only newer patch releases and the package registry rejects them under its minimum-release-age policy, keep the installed compatible versions rather than bypassing the guard.

**Why:** Expo preview started successfully despite the optional DevTools error, and the registry refused newly published SDK-matched patch versions as too recent.

**How to apply:** Confirm Metro and the app preview load before treating the DevTools message as fatal. Retry package updates after the registry age window passes.
