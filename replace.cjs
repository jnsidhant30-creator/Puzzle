const fs = require('fs');
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

const target1 = `const handleGoogleAuth = async () => { if (loading) return; setError(null); setLoading(true); try { const res = await signInWithPopup(auth, googleProvider); const profile = await syncUserProfile(res.user); setUser(profile, false); } catch (err: any) { console.error('Google Auth Error:', err); setError(err.message || 'Google Authentication failed'); } finally { setLoading(false); } };`;
const replacement1 = `const handleGoogleAuth = async () => { if (loading) return; setError(null); setLoading(true); try { const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); if (isMobile) { await signInWithRedirect(auth, googleProvider); return; } else { const res = await signInWithPopup(auth, googleProvider); const profile = await syncUserProfile(res.user); setUser(profile, false); setLoading(false); } } catch (err: any) { console.error('Google Auth Error:', err); let msg = err.message || 'Google Authentication failed'; if (err.code === 'auth/popup-blocked') msg = 'Popup blocked by browser. Please allow popups.'; if (err.code === 'auth/popup-closed-by-user') msg = 'Authentication cancelled.'; if (err.code === 'auth/unauthorized-domain') msg = 'This domain is not authorized. Check Firebase settings.'; setError(msg); setLoading(false); } };`;
content = content.replace(target1, replacement1);

const target2 = `import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup\n} from 'firebase/auth';`;
const replacement2 = `import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, signInWithRedirect, getRedirectResult\n} from 'firebase/auth';`;
content = content.replace(target2, replacement2);

const target3 = `const [resetSent, setResetSent] = useState(false); const handleAuth`;
const replacement3 = `const [resetSent, setResetSent] = useState(false); React.useEffect(() => { const checkRedirect = async () => { try { const result = await getRedirectResult(auth); if (result && result.user) { const profile = await syncUserProfile(result.user); setUser(profile, false); } } catch (err: any) { console.error('Google Auth Redirect Error:', err); let msg = err.message || 'Google Authentication failed'; if (err.code === 'auth/unauthorized-domain') msg = 'Domain not authorized in Firebase settings.'; else if (err.code === 'auth/account-exists-with-different-credential') msg = 'Account exists with different credential.'; setError(msg); } }; checkRedirect(); }, [setUser]); const handleAuth`;
content = content.replace(target3, replacement3);

fs.writeFileSync('src/components/AuthModal.tsx', content);
