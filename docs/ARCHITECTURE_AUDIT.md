# Architecture & Backend Audit - PuzzleVerse

## 1. Current Architecture
- **Frontend Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **Authentication**: Firebase Authentication (Email/Password, Phone OTP with reCAPTCHA).
- **Database**: Firebase Cloud Firestore (Direct Client-to-Firestore).
- **Hosting**: Firebase Hosting (SPA configuration).
- **State Management**: Zustand stores.
- **Styling**: Tailwind CSS.

### Unused/Legacy Architecture
- **Express Backend**: The `server/src` directory contains a full Express REST API (controllers, routes, db connection) that duplicates Firebase services. However, it is **LEGACY / UNUSED**. The React application never calls this API; all `fetch` and database interactions are performed directly via the Firebase JS SDK in `client/src/services`.

## 2. Frontend
The frontend follows a service-oriented architecture:
- `client/src/components`: UI components.
- `client/src/pages`: Route-level views.
- `client/src/services`: Contains the direct Firebase interactions.
- `client/src/store`: Zustand and React Context state.

## 3. Authentication
Active implementation supports:
- Email/Password login and registration.
- Phone OTP (requires Firebase Console configuration for production).
- Forgot Password functionality.
- Persistent sessions via Firebase Auth.
- Admin protection (enforced by `role === 'ADMIN'` in Firestore).

## 4. Database (Source of Truth)
The definitive source of truth is **Cloud Firestore**.
Collections:
- `users`: User profiles, stats, XP, level.
- `gameSessions`: Individual game records.
- `leaderboards`: Periodic high scores.
- `achievements`: Available achievements.
- `userAchievements`: Player unlocks.
- `dailyPuzzles`: Curated daily challenges.
- `notifications`: System/admin alerts.
- `settings`: User preferences.

## 5. Backend/API (Express)
- **Status**: UNUSED / LEGACY.
- **Recommendation**: Remove `server/` directory in a future cleanup phase. It creates confusion and duplicates the logic already functioning via the Firebase SDK on the client.

## 6. Data Flow
Most operations follow this pattern:
**UI -> Service (`client/src/services`) -> Firebase SDK -> Cloud Firestore**

### Sensitive Data Writes
Operations like completing a game (`processGameResult`) execute client-side calculations for XP, level, accuracy, and streaks, and then directly update the `users` and `gameSessions` collections.

## 7. Security Boundaries
The `firestore.rules` protect basic constraints:
- Players can only update their own documents.
- Admin status (`role`) cannot be escalated by a player.
- Game sessions are locked after creation (`allow update: if false;`).

## 8. Client-Trusted Data (DUAL MODE)
*(Updated in Phase 20.2)*
PuzzleVerse now supports two modes:
- **FREE Mode**: Re-enables client-trusted progression to support zero-cost deployments (no Blaze plan required). Users calculate their own XP and stats. Firestore rules prevent users from modifying other users' stats or escalating to ADMIN.
- **SERVER Mode**: Uses the `submitGameResult` Cloud Function to securely calculate and write XP, Levels, and Stats server-side.

**Remaining Risk (FREE Mode)**: A malicious user can manipulate the React app's memory to inflate their own XP/Stats. 
**Remaining Risk (SERVER Mode)**: A malicious user can fake the payload to the Cloud Function, but the server enforces bounds and calculates final numbers securely.

## 9. Server-Authoritative Data
*(Implemented in Phase 20, active in SERVER mode)*
When `VITE_GAME_RESULT_MODE=SERVER`, the following operations are managed by **Firebase Cloud Functions**:
1. **Game Validation & Scoring**
2. **XP & Level Progression**
3. **Streak Updates**
4. **Achievement Unlocks**
5. **Game Session saving**

## 10. PWA Status
**IMPLEMENTED**.
- Built with `vite-plugin-pwa` (`PWA v1.3.0`).
- Generates `sw.js` and precaches static assets.
- `manifest.webmanifest` and offline icons exist.

## 11. Technical Debt
- Unused `server` directory (Express API).
- Client-side data calculations.
- Expensive queries: `leaderboardService` attempts to fetch the top 1000 users locally if the user is not found.

## 12. Recommended Future Architecture
Maintain the simple, serverless stack but enforce security boundaries:
1. **React/Vite Frontend**
2. **Firebase Authentication**
3. **Cloud Firestore**
4. **Firebase Cloud Functions** (Introduce for all `CLIENT-TRUSTED` write operations).
5. **Firebase App Check** (Enable before public launch to block unauthorized API traffic).

Do not introduce Docker, Postgres, or Kubernetes. Stick to the Firebase ecosystem for simplicity.
