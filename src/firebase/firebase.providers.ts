import * as admin from 'firebase-admin';

export const FIRESTORE = 'FIRESTORE';

export const firebaseProviders = [
  {
    provide: FIRESTORE,
    useFactory: () => {
      if (admin.apps.length === 0) {
        const hasExplicitCreds =
          !!process.env.FB_PROJECT_ID &&
          !!process.env.FB_CLIENT_EMAIL &&
          !!process.env.FB_PRIVATE_KEY;

        if (hasExplicitCreds) {
          const credential = admin.credential.cert({
            projectId: process.env.FB_PROJECT_ID as string,
            clientEmail: process.env.FB_CLIENT_EMAIL as string,
            privateKey: (process.env.FB_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
          });
          admin.initializeApp({
            credential,
            storageBucket: process.env.FB_STORAGE_BUCKET,
            projectId: process.env.FB_PROJECT_ID,
          });
        } else {
          admin.initializeApp();
        }
      }
      const db = admin.firestore();
      return db;
    },
  },
];
