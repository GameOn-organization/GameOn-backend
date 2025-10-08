// Script para testar o endpoint de debug
const axios = require('axios');

async function testPhoneEndpoint() {
  try {
    const baseURL = 'http://localhost:3000'; // Ajuste conforme sua configuração
    
    console.log('Testando endpoint de debug...');
    
    // Testar o endpoint de debug
    const response = await axios.get(`${baseURL}/users/debug/bpDURsXsnnqUqqW9ETZ4RHaxHLoE`);
    
    console.log('Resposta do endpoint de debug:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar se o campo phone está presente
    if (response.data.phone !== undefined) {
      console.log('\n✅ Campo phone está presente:', response.data.phone);
    } else {
      console.log('\n❌ Campo phone NÃO está presente');
    }
    
  } catch (error) {
    console.error('Erro ao testar endpoint:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testPhoneEndpoint();