# Security - PuzzleVerse

PuzzleVerse relies on Firebase for robust authentication and database services.

## Authentication
- **Email/Password** is the strictly supported method.
- No third-party OAuth (Google Sign-in) or SMS-based OTPs are enabled to maintain platform control and eliminate dependency on paid third-party APIs.

## Database Security & Dual-Mode Game Results

PuzzleVerse supports two operational modes via `VITE_GAME_RESULT_MODE`:

### 1. FREE Mode (Client-Trusted)
- **Use Case**: Development, Demos, Portfolios, Free-tier deployments.
- **Security**: The client directly calculates XP, Levels, and Streaks and writes them to Firestore. `firestore.rules` are rigidly configured to allow users to ONLY write to their OWN documents (`users/{userId}`, `dailyRewards/{userId}`), preventing them from modifying other users' data or escalating their `role` to `ADMIN`.
- **Limitations**: A malicious user can intercept the frontend logic and manipulate their own stats. This is NOT suitable for high-stakes competitive leaderboard integrity.

### 2. SERVER Mode (Server-Authoritative)
- **Use Case**: Production deployments with competitive integrity.
- **Security**: The client is completely untrusted for gameplay outcomes. All results must be submitted to the `submitGameResult` Cloud Function, which validates the inputs (time taken, hints used, etc.), securely awards XP, and determines level progression.

## Firestore Rules Audit (Phase 49)
The `firestore.rules` file enforces zero-trust logic:
- `users`: Protected by `isOwner(userId)` and `isAdmin()`. Role escalation is explicitly blocked using `hasOnly()`.
- `publicProfiles`: Write access requires ownership. Read access requires authentication.
- `dailyRewards`: Strict ownership enforcement for both read and write.
- `adminAuditLogs`, `dailyPuzzles`, `puzzles`: Guarded exclusively behind `isAdmin()` checks.
