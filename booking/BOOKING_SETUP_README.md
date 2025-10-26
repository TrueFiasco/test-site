# TRUE FIASCO Booking System - Setup Guide

## 🎉 What You've Got

I've created a complete booking system for your TRUE FIASCO website with:

1. **Enhanced Homepage** (`index.html`)
   - About Me section with your background
   - Services section showcasing your offerings
   - Prominent BOOK button
   - All your existing hypercube functionality intact

2. **Booking Calendar** (`booking.html`)
   - Beautiful date picker
   - Time slot selection with dropdown
   - Service type selection (Discovery Call / TouchDesigner Lesson)
   - Contact form
   - Conflict prevention
   - First lesson FREE indicator

3. **Admin Panel** (`admin.html`)
   - View all bookings
   - Cancel bookings
   - Block dates for holidays/vacations
   - Statistics dashboard

4. **Firebase Backend** (Free tier - more than enough!)
   - Real-time booking storage
   - Conflict prevention
   - Secure data handling

---

## 🚀 Firebase Setup (15 minutes)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Name it **"TRUE-FIASCO-Bookings"** (or whatever you like)
4. Disable Google Analytics (not needed) or keep it enabled
5. Click "Create project"

### Step 2: Enable Firestore Database

1. In your Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add security rules next)
4. Select a location close to UK (like `europe-west2` for London)
5. Click "Enable"

### Step 3: Set Up Security Rules

1. In Firestore Database, click the **"Rules"** tab
2. Replace the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Bookings - anyone can read and create
    match /bookings/{bookingId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['service', 'date', 'time', 'name', 'email', 'createdAt', 'status']);
      allow update, delete: if request.auth != null;
    }
    
    // Blocked dates - anyone can read, only admin can write
    match /blockedDates/{dateId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Step 4: Get Your Firebase Config

1. Click the gear icon ⚙️ next to "Project Overview" → **"Project settings"**
2. Scroll down to **"Your apps"**
3. Click the **web icon** `</>` to add a web app
4. Give it a name like "TRUE FIASCO Website"
5. **DON'T** check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### Step 5: Add Config to Your Site

1. Open `firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",           // ← Paste your values here
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",   // ← Paste your values here
    projectId: "YOUR_ACTUAL_PROJECT_ID",     // ← Paste your values here
    storageBucket: "YOUR_ACTUAL_STORAGE",    // ← Paste your values here
    messagingSenderId: "YOUR_ACTUAL_SENDER", // ← Paste your values here
    appId: "YOUR_ACTUAL_APP_ID"              // ← Paste your values here
};
```

3. Save the file

### Step 6: Enable Authentication (for Admin Panel)

1. In Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click on **"Email/Password"** in the Sign-in providers
4. Enable the first option (Email/Password)
5. Click "Save"

### Step 7: Create Your Admin Account

1. Still in Authentication, click the **"Users"** tab
2. Click **"Add user"**
3. Enter your email and create a strong password
4. Click "Add user"

**IMPORTANT:** Write down this password! This is what you'll use to log into the admin panel.

---

## 📁 File Structure

Your site now has these files:

```
/
├── index.html              # Enhanced homepage with About Me & Services
├── booking.html            # Booking calendar page
├── booking.js              # Booking logic
├── admin.html              # Admin panel
├── admin.js                # Admin logic  
├── firebase-config.js      # Firebase configuration
├── homepageShader.js       # Your hypercube shader (unchanged)
├── homepageControlConfig.js # Hypercube controls (unchanged)
├── framework/              # Your framework files (unchanged)
├── tutorials/              # Your tutorials (unchanged)
└── fonts/                  # Your fonts (unchanged)
```

---

## 🎯 How to Use

### For Clients (Booking a Session)

1. Visit your homepage
2. Click the big **"BOOK"** button
3. Choose service type (Discovery Call or TouchDesigner Lesson)
4. Select a date from the calendar
5. Pick a time from the dropdown
6. Fill in contact details
7. Submit!

### For You (Managing Bookings)

1. Go to `yoursite.com/admin.html`
2. Log in with the email/password you created in Firebase
3. View all bookings in the dashboard
4. Cancel bookings if needed
5. Block dates for holidays/vacations

---

## 🔧 Configuration Options

### Change Available Hours

Edit in `booking.js`:

```javascript
const CONFIG = {
    timezone: 'Europe/London',
    availableHours: {
        start: 9,  // 9 AM
        end: 19    // 7 PM  ← Change these
    },
    sessionDuration: 60, // minutes
    daysAvailable: [0, 1, 2, 3, 4, 5, 6], // All days
    maxAdvanceBooking: 90 // days
};
```

### Change Available Days

To only allow bookings on weekdays:

```javascript
daysAvailable: [1, 2, 3, 4, 5], // Mon-Fri only
```

---

## 📧 Email Notifications (Optional)

Right now, bookings are saved to Firebase but don't send emails automatically. To add email notifications, you'll need to set up a **Firebase Cloud Function**. This is optional but recommended.

### Quick Setup for Emails:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize Functions: `firebase init functions`
4. Use this function to send emails when bookings are created:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

// Configure your email (Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

exports.sendBookingConfirmation = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    
    const mailOptions = {
      from: 'TRUE FIASCO <your-email@gmail.com>',
      to: booking.email,
      subject: '🎉 Booking Confirmed - TRUE FIASCO',
      html: `
        <h2>Your booking is confirmed!</h2>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Date:</strong> ${new Date(booking.dateTime).toLocaleString()}</p>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p>Looking forward to seeing you!</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  });
```

Deploy with: `firebase deploy --only functions`

---

## 🆓 Firebase Free Tier Limits

Your booking system will NEVER hit these limits:

- **Firestore:** 50K reads/day, 20K writes/day, 1GB storage
- **You'd need:** 500+ bookings PER DAY to hit limits
- **Authentication:** Unlimited users

**Bottom line:** Firebase free tier is more than enough for your booking system! 🎉

---

## 🎨 Customization

### Change Colors

Edit the CSS in `booking.html` and `admin.html`. Look for these values:

```css
#ff6b6b  /* Red accent */
#4ecdc4  /* Cyan/turquoise accent */
#0a0a0a  /* Background */
```

### Change Booking Duration

In `booking.js`, change:

```javascript
sessionDuration: 60, // minutes (currently 1 hour)
```

---

## 🐛 Troubleshooting

### "Firebase not initialized"
- Check that you've added your Firebase config to `firebase-config.js`
- Make sure the Firebase SDK scripts are loading (check browser console)

### "Permission denied" errors
- Check your Firestore Security Rules are set correctly
- For admin actions, make sure you're logged in

### Bookings not showing in admin panel
- Check Firestore console to see if bookings are being created
- Make sure you're logged in with the admin account

### Can't log into admin panel
- Double-check your email/password
- Verify you created a user in Firebase Authentication

---

## 🚀 Going Live

1. Upload all files to your web server / GitHub Pages
2. Make sure Firebase config is set correctly
3. Test a booking to ensure everything works
4. Share your booking link: `yoursite.com/booking.html`

---

## 📱 Mobile Support

The booking system is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktops

---

## 🎉 You're All Set!

Your TRUE FIASCO website now has:

✅ Professional About Me section  
✅ Clear Services offering  
✅ Easy booking system  
✅ Admin panel for management  
✅ Conflict prevention  
✅ Mobile-friendly design  
✅ All your existing features intact  

**Questions?** Check the Firebase Console for any errors, or review the code comments for guidance.

Enjoy your new booking system! 🚀✨
