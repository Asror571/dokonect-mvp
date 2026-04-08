import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      phone: '+998903333333',
      password: '123456'
    });
    token = response.data.data.accessToken;
    console.log('✅ Login successful');
    return true;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
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
    return true;
  } catch (error: any) {
    console.error(`❌ ${method} ${url}:`, error.response?.status, error.response?.data?.error || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Distributor Endpoints\n');
  
  if (!await login()) {
    console.log('\n❌ Cannot proceed without login');
    return;
  }
  
  console.log('\n📊 Analytics Endpoints:');
  await testEndpoint('GET', '/distributor/dashboard/stats');
  await testEndpoint('GET', '/distributor/analytics/dashboard');
  await testEndpoint('GET', '/distributor/analytics/sales');
  await testEndpoint('GET', '/distributor/analytics/profit');
  await testEndpoint('GET', '/distributor/analytics/inventory');
  
  console.log('\n📦 Product Endpoints:');
  await testEndpoint('GET', '/distributor/products');
  await testEndpoint('GET', '/distributor/categories');
  await testEndpoint('GET', '/distributor/brands');
  
  console.log('\n📋 Inventory Endpoints:');
  await testEndpoint('GET', '/distributor/inventory');
  await testEndpoint('GET', '/distributor/inventory/low-stock');
  
  console.log('\n🏢 Warehouse Endpoints:');
  await testEndpoint('GET', '/distributor/warehouses');
  
  console.log('\n🛒 Order Endpoints:');
  await testEndpoint('GET', '/distributor/orders');
  await testEndpoint('GET', '/distributor/orders/stats');
  
  console.log('\n💰 Pricing Endpoints:');
  await testEndpoint('GET', '/distributor/pricing/rules');
  await testEndpoint('GET', '/distributor/pricing/bulk-rules');
  await testEndpoint('GET', '/distributor/pricing/promo-codes');
  
  console.log('\n✅ Test completed!');
}

runTests();
