import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

async function check() {
  const app = initializeApp(config);
  
  // 1. Current DB from config
  const db1 = getFirestore(app, config.firestoreDatabaseId);
  const snap1 = await getDocs(collection(db1, 'users'));
  console.log(`Users in ${config.firestoreDatabaseId}: ${snap1.size}`);
  snap1.docs.forEach(d => console.log(` - ${d.data().email}`));

  // 2. Default DB
  try {
    const db2 = getFirestore(app, '(default)');
    const snap2 = await getDocs(collection(db2, 'users'));
    console.log(`Users in (default): ${snap2.size}`);
    snap2.docs.forEach(d => console.log(` - ${d.data().email}`));
  } catch (e) {
    console.log('Error checking (default) DB');
  }
}

check();
