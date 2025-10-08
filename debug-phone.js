const admin = require('firebase-admin');

// Inicializar Firebase Admin (ajuste as credenciais conforme necessário)
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugUser() {
  try {
    // Buscar o usuário específico
    const userId = 'bpDURsXsnnqUqqW9ETZ4RHaxHLoE';
    const doc = await db.collection('profiles').doc(userId).get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log('Dados completos do usuário no Firestore:');
      console.log(JSON.stringify(data, null, 2));
      
      // Verificar especificamente o campo phone
      console.log('\nCampo phone específico:');
      console.log('phone:', data.phone);
      console.log('phone type:', typeof data.phone);
      console.log('phone exists:', 'phone' in data);
    } else {
      console.log('Usuário não encontrado');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

debugUser();