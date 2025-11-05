#!/usr/bin/env node

/**
 * Script para limpar usuários órfãos do Firebase Authentication
 * 
 * Usuários órfãos são aqueles que existem no Firebase Auth mas não no Firestore.
 * Isso acontece quando deletamos usuários do Firestore sem deletar do Auth.
 * 
 * Uso: node scripts/cleanup-orphan-users.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function main() {
  try {
    log(colors.cyan, '╔════════════════════════════════════════════════════════════════╗');
    log(colors.cyan, '║  LIMPEZA DE USUÁRIOS ÓRFÃOS DO FIREBASE AUTH                  ║');
    log(colors.cyan, '╚════════════════════════════════════════════════════════════════╝\n');

    // Inicializar Firebase Admin
    const serviceAccountPath = path.join(__dirname, '..', 'tcc-gameon-firebase-adminsdk-fbsvc-4b8741b5da.json');
    
    if (!admin.apps.length) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      log(colors.green, '✅ Firebase Admin inicializado\n');
    }

    const db = admin.firestore();
    const auth = admin.auth();

    // 1. Buscar todos os usuários do Firebase Auth
    log(colors.blue, '📋 Buscando usuários do Firebase Authentication...');
    const listUsersResult = await auth.listUsers(1000);
    const authUsers = listUsersResult.users;
    log(colors.green, `✅ Encontrados ${authUsers.length} usuários no Firebase Auth\n`);

    // 2. Buscar todos os perfis do Firestore
    log(colors.blue, '📋 Buscando perfis do Firestore...');
    const profilesSnapshot = await db.collection('profiles').get();
    const firestoreUids = new Set(profilesSnapshot.docs.map(doc => doc.id));
    log(colors.green, `✅ Encontrados ${firestoreUids.size} perfis no Firestore\n`);

    // 3. Identificar usuários órfãos
    const orphanUsers = authUsers.filter(user => !firestoreUids.has(user.uid));

    if (orphanUsers.length === 0) {
      log(colors.green, '🎉 Nenhum usuário órfão encontrado! Tudo está sincronizado.');
      return;
    }

    log(colors.yellow, `⚠️  Encontrados ${orphanUsers.length} usuários órfãos:\n`);
    
    orphanUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || 'Sem email'} (UID: ${user.uid})`);
    });

    console.log('\n');
    log(colors.yellow, '🗑️  Deseja deletar todos esses usuários do Firebase Auth? (y/n)');

    // Ler resposta do usuário
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('> ', async (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        log(colors.blue, '\n❌ Operação cancelada pelo usuário.');
        process.exit(0);
      }

      console.log('\n');
      log(colors.blue, '🗑️  Deletando usuários órfãos...\n');

      let deletedCount = 0;
      let errorCount = 0;

      for (const user of orphanUsers) {
        try {
          await auth.deleteUser(user.uid);
          log(colors.green, `✅ Deletado: ${user.email || 'Sem email'} (${user.uid})`);
          deletedCount++;
        } catch (error) {
          log(colors.red, `❌ Erro ao deletar ${user.email || 'Sem email'}: ${error.message}`);
          errorCount++;
        }
      }

      console.log('\n');
      log(colors.cyan, '╔════════════════════════════════════════════════════════════════╗');
      log(colors.cyan, '║  RESUMO DA LIMPEZA                                            ║');
      log(colors.cyan, '╚════════════════════════════════════════════════════════════════╝\n');
      log(colors.green, `✅ Usuários deletados: ${deletedCount}`);
      if (errorCount > 0) {
        log(colors.red, `❌ Erros: ${errorCount}`);
      }
      log(colors.blue, `📊 Total de usuários órfãos: ${orphanUsers.length}\n`);

      if (deletedCount === orphanUsers.length) {
        log(colors.green, '🎉 Limpeza concluída com sucesso!');
      } else {
        log(colors.yellow, '⚠️  Limpeza concluída com alguns erros.');
      }

      process.exit(0);
    });
  } catch (error) {
    log(colors.red, '\n❌ Erro fatal:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});

