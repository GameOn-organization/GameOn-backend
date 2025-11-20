/**
 * Script para testar criação de notificação
 * 
 * Uso:
 *   node test-create-notification.js
 * 
 * Ou com URL customizada:
 *   API_URL=https://sua-url.com node test-create-notification.js
 */

const admin = require('firebase-admin');

// URL da API (pode ser definida via variável de ambiente)
// Por padrão, usa a URL de produção
const API_URL = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://api-m2z4unnk3a-uc.a.run.app';

// Credenciais do usuário
const USER_EMAIL = 'desire@gmail.com';
const USER_PASSWORD = 'senha123456';

// Inicializar Firebase Admin (se necessário)
let firebaseInitialized = false;

async function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    // Tentar inicializar com arquivo de credenciais
    const serviceAccount = require('./tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase Admin inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    console.log('⚠️  Continuando sem Firebase Admin (pode ser necessário para obter idToken)');
  }
}

async function httpRequest(method, url, data = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
  }
  
  return responseData;
}

async function login() {
  console.log('\n🔵 [TEST] Fazendo login...');
  console.log(`🔵 [TEST] URL: ${API_URL}`);
  console.log(`🔵 [TEST] Email: ${USER_EMAIL}`);
  
  try {
    const data = await httpRequest('POST', `${API_URL}/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });
    
    console.log('✅ [TEST] Login bem-sucedido!');
    console.log(`✅ [TEST] User ID: ${data.user?.uid}`);
    console.log(`✅ [TEST] Custom Token recebido: ${data.customToken ? 'Sim' : 'Não'}`);
    
    return data;
  } catch (error) {
    console.error('❌ [TEST] Erro no login:', error.message);
    throw error;
  }
}

async function getUserIdToken(customToken, uid) {
  if (!firebaseInitialized) {
    console.log('⚠️  Firebase Admin não inicializado, usando customToken diretamente');
    return customToken;
  }
  
  try {
    // O AuthGuard aceita custom tokens, então podemos usar diretamente
    // Mas vamos verificar se funciona melhor com um idToken criado pelo Admin
    console.log('✅ [TEST] Usando customToken (AuthGuard aceita custom tokens)');
    console.log('✅ [TEST] UID:', uid);
    
    // O AuthGuard já aceita custom tokens, então vamos usar diretamente
    return customToken;
  } catch (error) {
    console.error('❌ [TEST] Erro ao processar token:', error.message);
    return customToken;
  }
}

async function createNotification(userId, idToken) {
  console.log('\n🔵 [TEST] Criando notificação de teste...');
  console.log(`🔵 [TEST] User ID: ${userId}`);
  console.log(`🔵 [TEST] Token (primeiros 50 chars): ${idToken.substring(0, 50)}...`);
  
  const notificationData = {
    userId: userId, // Usuário que recebe a notificação
    fromUserId: 'test-user-123', // Usuário que gerou a notificação (pode ser qualquer ID)
    fromUsername: 'Sistema de Teste',
    action: 'Esta é uma notificação de teste criada automaticamente! 🎉',
    category: 'Comunidade',
  };
  
  // Remover campos undefined
  Object.keys(notificationData).forEach(key => {
    if (notificationData[key] === undefined) {
      delete notificationData[key];
    }
  });
  
  console.log('🔵 [TEST] Dados da notificação:', JSON.stringify(notificationData, null, 2));
  
  try {
    const data = await httpRequest(
      'POST',
      `${API_URL}/notifications`,
      notificationData,
      {
        'Authorization': `Bearer ${idToken}`,
      }
    );
    
    console.log('✅ [TEST] Notificação criada com sucesso!');
    console.log('✅ [TEST] ID da notificação:', data.id);
    console.log('✅ [TEST] Dados da notificação:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ [TEST] Erro ao criar notificação:', error.message);
    throw error;
  }
}

async function getNotifications(userId, idToken) {
  console.log('\n🔵 [TEST] Buscando notificações...');
  console.log(`🔵 [TEST] User ID: ${userId}`);
  
  try {
    const url = new URL(`${API_URL}/notifications`);
    url.searchParams.append('userId', userId);
    
    const data = await httpRequest(
      'GET',
      url.toString(),
      null,
      {
        'Authorization': `Bearer ${idToken}`,
      }
    );
    
    console.log('✅ [TEST] Notificações encontradas:', data.length);
    console.log('✅ [TEST] Notificações:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ [TEST] Erro ao buscar notificações:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 [TEST] Iniciando teste de criação de notificação');
  console.log(`🚀 [TEST] API URL: ${API_URL}`);
  
  try {
    // 1. Inicializar Firebase Admin
    await initializeFirebase();
    
    // 2. Fazer login
    const loginResult = await login();
    const userId = loginResult.user.uid;
    const customToken = loginResult.customToken;
    
    // 3. Obter ID token (ou usar customToken)
    const idToken = await getUserIdToken(customToken, userId);
    
    // 4. Criar notificação
    const notification = await createNotification(userId, idToken);
    
    // 5. Buscar notificações para verificar
    await getNotifications(userId, idToken);
    
    console.log('\n✅ [TEST] Teste concluído com sucesso!');
    console.log(`✅ [TEST] Notificação criada com ID: ${notification.id}`);
    console.log(`✅ [TEST] Verifique no app se a notificação aparece para o usuário ${USER_EMAIL}`);
    
  } catch (error) {
    console.error('\n❌ [TEST] Teste falhou:', error.message);
    process.exit(1);
  }
}

// Executar
main().catch(console.error);

