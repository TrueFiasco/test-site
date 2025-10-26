// ==========================================
// FIREBASE CONFIGURATION - TRUE FIASCO
// ==========================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Add a web app to your project
// 4. Copy your Firebase config and replace the values below
// 5. Enable Firestore Database in Firebase Console
// 6. Set up Firestore security rules (see below)
// 
// ==========================================

// YOUR FIREBASE CONFIG
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBZUxYOKzZUA_Q32FLSOvF1JHDJMsLT0VE",
  authDomain: "true-fiasco-bookings.firebaseapp.com",
  projectId: "true-fiasco-bookings",
  storageBucket: "true-fiasco-bookings.firebasestorage.app",
  messagingSenderId: "755464362125",
  appId: "1:755464362125:web:f754d202836e62c111aac4",
  measurementId: "G-92TQ1EVMRT"
};

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        // Make db available globally
        window.db = db;
        
        console.log('✅ Firebase initialized successfully');
    } else {
        console.error('❌ Firebase SDK not loaded');
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

// ==========================================
// FIRESTORE SECURITY RULES
// ==========================================
// Copy these rules to your Firestore Rules tab in Firebase Console:
/*

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Bookings collection - anyone can read and create
    match /bookings/{bookingId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['service', 'date', 'time', 'name', 'email', 'createdAt', 'status']);
      allow update, delete: if request.auth != null; // Only authenticated users (admin)
    }
    
    // Blocked dates - anyone can read, only admin can write
    match /blockedDates/{dateId} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users (admin)
    }
    
    // Admin settings - only admin can access
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
  }
}

*/

// ==========================================
// FIRESTORE DATA STRUCTURE
// ==========================================
/*

COLLECTION: bookings
Document structure:
{
  service: "discovery" | "lesson",
  date: "2025-01-15" (ISO date string),
  time: 14 (hour in 24h format),
  dateTime: "2025-01-15T14:00:00.000Z" (full ISO datetime),
  name: "John Doe",
  email: "john@example.com",
  phone: "+44 7XXX XXXXXX" | null,
  notes: "Looking to learn TouchDesigner basics" | null,
  createdAt: "2025-01-10T10:30:00.000Z",
  status: "confirmed" | "cancelled"
}

COLLECTION: blockedDates
Document structure:
{
  date: "2025-01-15" (ISO date string),
  reason: "Holiday" | "Vacation" | "Other booking" | null,
  createdAt: "2025-01-10T10:30:00.000Z"
}

*/
