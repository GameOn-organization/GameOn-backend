import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

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
          // Usar credenciais das variáveis de ambiente
          const credential = admin.credential.cert({
            projectId: process.env.FB_PROJECT_ID as string,
            clientEmail: process.env.FB_CLIENT_EMAIL as string,
            privateKey: (process.env.FB_PRIVATE_KEY as string).replace(
              /\\n/g,
              '\n',
            ),
          });
          admin.initializeApp({
            credential,
            storageBucket: process.env.FB_STORAGE_BUCKET,
            projectId: process.env.FB_PROJECT_ID,
          });
          console.log('✅ Firebase inicializado com credenciais explícitas');
        } else {
          // Tentar carregar do arquivo JSON de credenciais
          const possiblePaths = [
            path.join(__dirname, '..', '..', 'tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json'),
            path.join(process.cwd(), 'tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json'),
            '/workspace/tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json',
          ];
          
          let serviceAccountPath: string | null = null;
          for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
              serviceAccountPath = p;
              break;
            }
          }
          
          if (serviceAccountPath) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase inicializado com arquivo de credenciais');
          } else {
            // Fallback para Application Default Credentials
            admin.initializeApp();
            console.log('✅ Firebase inicializado com Application Default Credentials');
          }
        }
      }

      const db = admin.firestore();

      // Log para confirmar conexão com emulador
      if (process.env.NODE_ENV === 'dev' && process.env.FIRESTORE_EMULATOR_HOST) {
        console.log(`🔧 Firestore conectado ao emulador: ${process.env.FIRESTORE_EMULATOR_HOST}`);
      }

      return db;
    },
  },
];
