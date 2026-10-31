# PuzzleVerse — Prioritized Issues & Defect Register

**Project:** PuzzleVerse — Ultimate Brain Challenge & Gamified Puzzles  
**Firebase Project ID:** `puzzleverse-e16e4`  
**Classification Standards:**
- **P0 — Critical:** Authentication failures, data loss, security rule vulnerabilities, game-breaking bugs causing unsolvable boards or infinite loops.
- **P1 — High:** Major feature breakage, Firestore permission errors, broken navigation, dead interactive buttons, progression reward failures.
- **P2 — Medium:** Unfinished UI components, dummy data masquerading as real data, missing secondary controls, incomplete hints.
- **P3 — Low:** Visual polish, cosmetic alignment, minor responsive tuning.

---

## P0 — Critical Issues (All Resolved)

### ISSUE-P0-01: Mobile Chrome Google Authentication Redirect Loop
- **Severity:** P0 — Critical (Authentication Failure)
- **Files Affected:** `public/_redirects`, `netlify.toml`, `src/services/firebase.ts`, `src/App.tsx`, `src/components/AuthModal.tsx`
- **Root Cause:**
  1. On Netlify (`puzzzleverse.netlify.app`), Google OAuth redirect used cross-origin communication with Firebase domains (`puzzleverse-e16e4.firebaseapp.com`). Mobile Chrome's Third-Party Cookie Deprecation and partitioned storage blocked credential retrieval upon redirect return.
  2. In `src/App.tsx`, `onAuthStateChanged` fired with `user === null` during initialization while `getRedirectResult(auth)` was still completing asynchronously. This caused `authLoading` to prematurely flip to `false` and immediately execute `window.history.replaceState(null, '', '/login')`, erasing the redirect flow.
- **Resolution:**
  - Added Netlify reverse proxy rewrite rule: `/__/auth/* https://puzzleverse-e16e4.firebaseapp.com/__/auth/:splat 200` in both `_redirects` and `netlify.toml`.
  - Dynamically configured `authDomain` in `src/services/firebase.ts` to match `window.location.hostname` when on Netlify.
  - Rewrote `initAuth()` in `src/App.tsx` to await `getRedirectResult(auth)` before attaching `onAuthStateChanged`, and set `sessionStorage.setItem('pv_auth_redirect_in_progress', '1')` in `AuthModal.tsx` to ensure loading state persists through mobile redirect restoration.

### ISSUE-P0-02: Word Grid Hard Mode Unsolvable Due to Vocabulary-Grid Dimension Mismatch
- **Severity:** P0 — Critical (Core Game Crash/Unsolvable)
- **Files Affected:** `src/games/WordGrid.tsx`
- **Root Cause:** In Hard mode, the dictionary included words with 8–9 characters (`CHALLENGE`, `DISCOVERY`, `LABYRINTH`). The game grid is strictly 6x6 (36 cells). Placement logic sliced or truncated words, resulting in missing characters that rendered the puzzle mathematically unsolvable.
- **Resolution:** Restructured `HARD_WORDS` to use exact 6-letter vocabulary (`CIPHER`, `VECTOR`, `BINARY`, `SYNTAX`, `MATRIX`). Added a working starting-letter reveal Hint button.

### ISSUE-P0-03: Arrow Path Dead-Ends and Infinite Cycles
- **Severity:** P0 — Critical (Core Game Solvability)
- **Files Affected:** `src/games/ArrowPath.tsx`
- **Root Cause:** Random arrow direction assignment generated cells that pointed into walls, formed closed 2-cell loops, or had zero viable paths from `(0,0)` to exit.
- **Resolution:** Implemented deterministic path generation: creates a guaranteed connected path from start to exit first, then assigns valid non-blocking directions to surrounding cells. Added winning-path highlight Hint.

### ISSUE-P0-04: Block Escape Zero-Collision Bug
- **Severity:** P0 — Critical (Core Game Logic Failure)
- **Files Affected:** `src/games/BlockEscape.tsx`
- **Root Cause:** Drag handlers lacked 2D grid cell occupancy checks; blocks could freely slide through each other, and the red escape block could exit in 2 trivial moves regardless of obstacles.
- **Resolution:** Implemented 2D cell occupancy matrix for 6x6 grid. Moving blocks now halt upon colliding with any occupied cell or grid boundary. Created structured level layouts for easy, medium, and hard modes. Added next-move Hint.

### ISSUE-P0-05: Maze Escape Missing Wall Generation
- **Severity:** P0 — Critical (Core Game Incomplete)
- **Files Affected:** `src/games/MazeEscape.tsx`
- **Root Cause:** The `walls` array was initialized empty, rendering an empty field with no obstacles.
- **Resolution:** Implemented procedural maze wall generator guaranteeing an open path to the exit, added wall collision detection, integrated keyboard controls (Arrow keys and WASD), and added breadcrumb path Hint.

### ISSUE-P0-06: Daily Reward Crash on Firebase Spark Plan
- **Severity:** P0 — Critical (Progression Failure)
- **Files Affected:** `src/services/firebase.ts`, `src/components/DailyRewardModal.tsx`
- **Root Cause:** Daily rewards invoked Cloud Function `claimDailyReward` via `httpsCallable`. The project is on the Firebase Spark (free) plan which does not support deployed Cloud Functions, resulting in unhandled network rejections (`functions/not-found` or `internal`).
- **Resolution:** Implemented idempotent client-side Firestore daily reward operations (`fetchDailyRewardStatus` and `claimDailyRewardInFirestore`) using UTC date strings (`YYYY-MM-DD`) and atomic Firestore updates with full reward tier progression.

---

## P1 — High Priority Issues (All Resolved)

### ISSUE-P1-01: Number Path Punishing Misclick Chain Deletion
- **Files Affected:** `src/games/NumberPath.tsx`
- **Problem:** Tapping an incorrect adjacent number wiped out the player's entire sequence (e.g., from 14 back to 0), causing extreme frustration.
- **Resolution:** Replaced full progress reset with a +2s time penalty, animated red cell shake, and added next-number pulse Hint.

### ISSUE-P1-02: Logic Puzzle Repetitive Riddles in Hard Mode
- **Files Affected:** `src/games/LogicPuzzle.tsx`
- **Problem:** `RIDDLES_HARD` contained only 3 items, causing the same riddle to repeat multiple times within a single 3-round session.
- **Resolution:** Expanded riddle pool to 6 diverse logic puzzles and implemented `usedQuestions` tracking for zero repetition within a game session.

### ISSUE-P1-03: Pattern Puzzle Static Missing Position
- **Files Affected:** `src/games/PatternPuzzle.tsx`
- **Problem:** Missing cell was hardcoded to index 8 (bottom-right cell) in every single puzzle.
- **Resolution:** Randomized missing cell position across indices 4, 6, 7, and 8; added Latin square sequence verification and logic explanation Hint.

### ISSUE-P1-04: Firestore Permission Denied on Guest Sessions
- **Files Affected:** `src/services/firebase.ts`
- **Problem:** Guest users (`guest_*`) triggered Firestore security rule rejections in console when querying `personalBestHistory`, `gameSessions`, `clubs`, and `mastery`.
- **Resolution:** Added permission guard checks (`if (!userId || userId.startsWith('guest_')) return ...`) across all user-scoped Firestore services.

### ISSUE-P1-05: Player Challenges 2.0 Commented-Out Game Launch
- **Files Affected:** `src/pages/ChallengesPage.tsx`
- **Problem:** Entering a room code in `handleJoinByCode` had `playChallengeMatch(...)` commented out, leaving the button completely inoperable and displaying raw browser alerts.
- **Resolution:** Uncommented `playChallengeMatch`, integrated toast feedback, and handled self-challenge detection.

### ISSUE-P1-06: Profile Favorite Games Toggle Disabled
- **Files Affected:** `src/pages/ProfilePage.tsx`
- **Problem:** `setFavoriteGames([...favoriteGames, id])` was commented out in `toggleFavorite`, preventing users from setting favorite games.
- **Resolution:** Uncommented state update with max-4 game selection limit.

### ISSUE-P1-07: Achievements Page Missing Claim Reward Mechanism
- **Files Affected:** `src/pages/AchievementsPage.tsx`
- **Problem:** Achievements displayed rewards (+100 XP, +50 Coins) but offered no way to claim them or record claimed state in user profile.
- **Resolution:** Added interactive "Claim Reward" buttons, updated user XP/coins and `user.achievements` map in Firestore, and triggered celebration toasts.

### ISSUE-P1-08: Goals Page Zero Coins Awarded in Local State
- **Files Affected:** `src/pages/GoalsPage.tsx`
- **Problem:** `handleClaim` called `addXPAndCoins(xpAwarded, 0, 0, true)`, passing 0 for coins.
- **Resolution:** Corrected argument to pass `coinsAwarded`, added success toast, and ensured synchronization with Firestore.

### ISSUE-P1-09: Daily Puzzle Hardcoded to Single Mode
- **Files Affected:** `src/pages/DailyPuzzlePage.tsx`
- **Problem:** Daily challenge was hardcoded to `laser_mirror` every single day.
- **Resolution:** Implemented deterministic day-of-year rotation across all 16 canonical puzzle modes with selectable difficulty and 2x XP multiplier.

### ISSUE-P1-10: Analytics Activity Heatmap Hardcoded Modulo Pattern
- **Files Affected:** `src/pages/InsightsPage.tsx`
- **Problem:** Heatmap generated arbitrary counts `(i % 3 === 0 ? ...)` rather than reflecting real user session dates.
- **Resolution:** Aggregated genuine session dates from `filteredSessions` and mapped them to 35-day activity levels.

### ISSUE-P1-11: Dead Notifications Bell in Navigation Header
- **Files Affected:** `src/components/Navbar.tsx`
- **Problem:** Bell icon was a dead button with a static red dot; notifications created in Firestore were never displayed.
- **Resolution:** Built full Notifications dropdown with unread counter, category icons, relative timestamps, and "Mark all read" Firestore actions.

### ISSUE-P1-12: Admin Announcement Broadcast Form Fake Submission
- **Files Affected:** `src/pages/AdminPage.tsx`
- **Problem:** Broadcast form called `setTimeout` without persisting announcements to any database.
- **Resolution:** Wired submission to `publishSocialActivity` with `activityType: 'announcement'` to post directly to `socialFeed`.

---

## P2 — Medium Priority Issues (All Resolved)

### ISSUE-P2-01: Leaderboard Masquerading Mock Users as Real Players
- **Files Affected:** `src/pages/LeaderboardPage.tsx`
- **Problem:** When Firestore had no leaderboard entries, fake mock records (`BrainiacMaster`) were displayed silently.
- **Resolution:** Implemented clear empty state with call-to-action button ("Claim Rank #1 Now") and an explicit "Demo Preview" toggle.

### ISSUE-P2-02: Misleading Navigation Labels in Sidebar
- **Files Affected:** `src/components/Sidebar.tsx`
- **Problem:** Events page was labeled "Notifications" with a Bell icon; Daily Puzzle, Leaderboard, and Admin Console links were missing.
- **Resolution:** Reorganized into Play, Social, Progress, and Discover groups with accurate icons and added direct links for Daily Puzzle, Leaderboard, Goals, Insights, and Admin.

### ISSUE-P2-03: Missing Hints Across Secondary Games
- **Files Affected:** `src/games/SlidingPuzzle.tsx`, `src/games/PipeConnect.tsx`, `src/games/RotatingTiles.tsx`, `src/games/LaserMirror.tsx`
- **Problem:** Multiple games lacked hint functionality, causing stuck players to abandon sessions.
- **Resolution:** Added intelligent, game-specific Hint buttons with coin/hint deductions across all 16 games.

---

## P3 — Low Priority Issues (All Resolved)
- Cleaned up brand styling to enforce Dragon Fruit (`#FF4696`) and Night Violet (`#1E1033`) across buttons, badges, and modals.
- Fixed TypeScript type annotations across `ClubDetailPage.tsx`, `AdminPage.tsx`, `AchievementsPage.tsx`, and `puzzles.ts`.
- Removed orphan `public/index.html` template to eliminate Vite build collisions.

