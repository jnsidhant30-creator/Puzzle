import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function testProfile() {
  try {
    const email = "test.user.1790268859428@example.com";
    const password = "Password123!";
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
       console.log("Profile already exists:", snap.data());
    } else {
       console.log("Creating new profile...");
       const newProfile = {
          uid: user.uid,
          username: 'test_user',
          role: 'PLAYER',
          level: 1,
          xp: 0
       };
       await setDoc(userRef, newProfile);
       console.log("Profile creation SUCCESS!");
    }
    process.exit(0);
  } catch(e) {
    console.error("FAILED:", e.message);
    process.exit(1);
  }
}
testProfile();
