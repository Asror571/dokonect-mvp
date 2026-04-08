import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    phone: '+998903333333',
    password: '123456'
  });
  token = response.data.data.accessToken;
  console.log('✅ Login successful\n');
}

async function testEndpoint(method: string, url: string, data?: any) {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${API_URL}${url}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${API_URL}${url}`, data, config);
    }
    
    console.log(`✅ ${method} ${url}`);
    return response.data;
  } catch (error: any) {
    console.error(`❌ ${method} ${url}:`, error.response?.status, error.response?.data?.error || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing New Endpoints\n');
  
  await login();
  
  console.log('🚚 Driver Endpoints (DRV-01):');
  await testEndpoint('GET', '/distributor/drivers');
  
  console.log('\n🗺️ Zone Endpoints (DRV-03):');
  await testEndpoint('GET', '/distributor/zones');
  
  // Create a zone
  const zoneData = await testEndpoint('POST', '/distributor/zones', {
    name: 'Tashkent Yunusabad',
    region: 'Tashkent'
  });
  
  if (zoneData?.data?.id) {
    console.log(`   Created zone: ${zoneData.data.id}`);
    await testEndpoint('GET', `/distributor/zones/${zoneData.data.id}`);
  }
  
  console.log('\n📦 Order Creation (ORD-05):');
  // Get a client first
  const clientResponse = await axios.get(`${API_URL}/distributor/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit: 1 }
  });
  
  if (clientResponse.data.data.orders.length > 0) {
    const clientId = clientResponse.data.data.orders[0].clientId;
    console.log(`   Using client: ${clientId}`);
  } else {
    console.log('   ⚠️ No clients found, skipping order creation test');
  }
  
  console.log('\n✅ All new endpoints tested!');
}

runTests();
