import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAuth() {
  const email = `test.user.${Date.now()}@example.com`;
  const password = "Password123!";
  console.log("Testing Auth against:", config.projectId);
  
  try {
    console.log(`[1] Creating account: ${email}`);
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Signup SUCCESS:", userCred.user.uid);
    
    // Wait for frontend's cloud function or syncUserProfile (if it was triggered)
    // Actually the client script doesn't trigger syncUserProfile because that's frontend code.
    // We are just testing if Auth works.
    
    console.log("[2] Logging out");
    await signOut(auth);
    console.log("Logout SUCCESS");
    
    console.log("[3] Logging in again");
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login SUCCESS");

    console.log("[4] Testing Forgot Password");
    await sendPasswordResetEmail(auth, email);
    console.log("Forgot Password SUCCESS");

    console.log("ALL TESTS PASS");
    process.exit(0);
  } catch(err) {
    console.error("AUTH TEST FAILED:", err.message);
    process.exit(1);
  }
}

testAuth();
