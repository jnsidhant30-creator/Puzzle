const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
const target = ` document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon'); document.documentElement.classList.add(\`theme-\${theme}\`); /* Auth listener */\n const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {`;
const replacement = ` document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-cyberpunk', 'theme-neon'); document.documentElement.classList.add(\`theme-\${theme}\`); /* Auth listener */
 getRedirectResult(auth).then(async (result) => { if (result?.user) { const profile = await syncUserProfile(result.user); setUser(profile, false); } }).catch(err => { console.error("Google Auth Redirect Error:", err); });
 const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {`;
content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
