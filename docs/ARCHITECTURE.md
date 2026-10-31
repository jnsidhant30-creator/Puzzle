# Architecture - PuzzleVerse

PuzzleVerse utilizes a modern, server-authoritative Firebase stack.

## Components
1. **Frontend**: React 18 + Vite + TypeScript.
2. **State**: Zustand for Auth, Global Games, and User Context.
3. **Authentication**: Firebase Auth (Email/Password strictly).
4. **Database**: Cloud Firestore.
5. **Backend Logic**: Firebase Cloud Functions (Matchmaking, Notifications).
6. **Hosting**: Firebase Hosting & Netlify.

## Dual-Mode Architecture (FREE vs SERVER)
PuzzleVerse supports two deployment modes toggled via `VITE_GAME_RESULT_MODE`:

### 1. FREE Mode (Default / Client-Trusted)
- Client plays a puzzle locally and calculates the score.
- Client securely evaluates XP, Level, and Streaks locally.
- Client securely evaluates Achievements and performs direct Firestore Batch Writes.
- **Why?**: Allows for a ₹0 cost deployment (e.g. Firebase Free Tier) while maintaining an exceptional user experience.
- **Security Strategy**: `firestore.rules` uses strict `isOwner` checks on `users/{userId}` and `dailyRewards/{userId}` endpoints to ensure data integrity, preventing cross-user manipulation.

### 2. SERVER Mode (Server-Authoritative)
1. Client plays a puzzle locally.
2. Upon completion, the client submits metrics via a `submitGameResult` Cloud Function.
3. The Server calculates the final trusted score, XP, and Streaks.
4. The Server updates `users`, `gameSessions`, and `leaderboards`.
- **Why?**: True production environment with strong anti-cheat capabilities.

## Cloud Functions
The `/functions` directory houses the Cloud Functions layer. Currently deployed functions handle:
- **Challenge Matchmaking** (Weekly, Friends).
- **Notifications** (System triggers).

## Legacy Backend
The `/server/src` directory contains an old Express API that is currently **UNUSED** and considered legacy. It was deprecated in favor of Firebase Cloud Functions to keep the architecture completely serverless and integrated directly with the Firebase ecosystem.
