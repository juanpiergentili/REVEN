
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function uploadCatalog() {
  console.log('Reading extracted-catalog.json...');
  const rawData = fs.readFileSync('./src/data/extracted-catalog.json', 'utf8');
  const catalog = JSON.parse(rawData);

  console.log(`Starting upload of ${catalog.length} brands...`);
  
  // We will store each brand as a document in 'catalog' collection
  for (const brandData of catalog) {
    const brandName = brandData.brand;
    console.log(`Uploading ${brandName}...`);
    
    // Using setDoc to overwrite if exists
    await setDoc(doc(db, 'catalog', brandName), {
      name: brandName,
      models: brandData.models,
      updatedAt: new Date().toISOString()
    });
  }

  console.log('Upload complete!');
}

uploadCatalog().catch(console.error);
