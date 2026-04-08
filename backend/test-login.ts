import axios from 'axios';

async function testLogin() {
  try {
    console.log('🧪 Testing login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      phone: '+998903333333',
      password: '123456',
      rememberMe: false
    });

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
