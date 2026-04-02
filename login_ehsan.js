const axios = require('axios');
async function login() {
  try {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'ehsan@example.com',
      password: 'Clinic123!'
    });
    console.log('Login Result:', JSON.stringify(res.data));
  } catch (err) {
    console.error('Login Failed:', err.response?.data || err.message);
  }
}
login();
