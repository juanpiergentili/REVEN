import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const email = 'admin@reven.com.ar';
  const password = 'q1w2e3r4-';

  try {
    console.log('Creando usuario admin...');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: 'Admin REVEN' });

    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      name: 'Admin',
      lastName: 'REVEN',
      company: 'REVEN',
      plan: 'admin',
      role: 'ADMIN',
      status: 'active',
      createdAt: serverTimestamp(),
    });

    console.log(`✅ Admin creado: ${email} (uid: ${cred.user.uid})`);
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('⚠️  El usuario admin ya existe en Firebase Auth.');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  process.exit(0);
}

createAdmin();
