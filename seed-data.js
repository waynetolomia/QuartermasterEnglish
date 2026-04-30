const admin = require('firebase-admin');

// 1. Download your Service Account Key from Firebase Console 
// (Project Settings -> Service Accounts -> Generate New Private Key)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Import the extensive list of 500 maritime vocabulary words
const maritimeVocab = require('./maritime_vocab.json');

async function seedDatabase() {
  const vocabRef = db.collection('vocabulary_master');
  
  console.log("Starting deployment of maritime terms...");
  
  for (const word of maritimeVocab) {
    await vocabRef.add(word);
    console.log(`Added: ${word.term}`);
  }
  
  console.log("Database successfully seeded! Your students are ready to learn.");
}

seedDatabase();