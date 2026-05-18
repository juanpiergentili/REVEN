import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBb8OZMeJTsmkJXok81IVe4Va7rNUSE9Ro",
  appId: "1:316361254730:web:95a6b8292abd9c641143b3",
  authDomain: "reven-b55d5.firebaseapp.com",
  projectId: "reven-b55d5",
  storageBucket: "reven-b55d5.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Sign‑in success for ${email} (uid ${cred.user.uid})`);
  } catch (e:any) {
    console.error(`❌ Sign‑in failed for ${email}:`, e.code, e.message);
  }
}

(async () => {
  await test('admin@reven.com.ar', 'R3v3n!Admin#2026'); // new password
  await test('admin2@reven.com.ar', 'q1w2e3r4-'); // original password
})();
