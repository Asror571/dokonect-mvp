import axios from 'axios';

async function testDashboard() {
  try {
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      phone: '+998903333333',
      password: '123456'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('✅ Login successful\n');
    
    // Get dashboard stats
    const dashboardRes = await axios.get(
      'http://localhost:5000/api/distributor/dashboard/stats',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('📊 Dashboard Stats:');
    console.log(JSON.stringify(dashboardRes.data, null, 2));
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboard();
