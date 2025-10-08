// Script para testar se o campo phone está sendo salvo corretamente
const admin = require('firebase-admin');

// Inicializar Firebase Admin (ajuste as credenciais conforme necessário)
// const serviceAccount = require('./path-to-your-service-account-key.json');

// Para teste local com emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({
  projectId: 'your-project-id' // Substitua pelo seu project ID
});

const db = admin.firestore();

async function testPhoneField() {
  try {
    console.log('Testando campo phone...');
    
    // Buscar todos os usuários
    const snap = await db.collection('profiles').get();
    
    console.log(`Encontrados ${snap.docs.length} usuários:`);
    
    snap.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\nUsuário ${index + 1}:`);
      console.log(`ID: ${data.id}`);
      console.log(`Nome: ${data.name}`);
      console.log(`Email: ${data.email}`);
      console.log(`Phone: ${data.phone || 'NÃO DEFINIDO'}`);
      console.log(`Phone existe: ${'phone' in data}`);
      console.log(`Dados completos:`, JSON.stringify(data, null, 2));
    });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testPhoneField();