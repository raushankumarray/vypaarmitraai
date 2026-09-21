# Firebase Integration & Configuration Guide
**VypaarMitra AI • NPB MEDIA**

---

## 1. Firebase Services Utilized
1. **Firebase Authentication**: User accounts, password encryption, custom claims (`role`, `companyId`, `supportLevel`).
2. **Cloud Firestore**: Realtime multi-tenant document database.
3. **Firebase Cloud Storage**: Business logos, PDF tax invoices, expense receipts.
4. **Firebase Cloud Messaging (FCM)**: Push notifications for low stock alerts and payment confirmations.
5. **Firebase Cloud Functions**: Background event triggers, ledger aggregations.

---

## 2. Environment Configuration
Create `.env.local` using the template below:

```bash
# Super Admin Initial Bootstrap Credentials
SUPERADMIN_USERNAME=adminn
SUPERADMIN_PASSWORD=Admin@88

# Client-Side Firebase SDK (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:...

# Server-Side Firebase Admin SDK (Privileged - NEVER EXPOSE TO CLIENT)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 3. Deployment Commands
Deploy Firestore and Storage security rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```
