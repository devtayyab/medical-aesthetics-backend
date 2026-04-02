const axios = require('axios');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVoc2FuQGV4YW1wbGUuY29tIiwic3ViIjoiY2YxYzYxMDAtYzQzYS00ZTBjLThlYjQtYzQ5M2Q3YmYyOGI1Iiwicm9sZSI6ImNsaW5pY19vd25lciIsImlhdCI6MTc3NDUwODI1NSwiZXhwIjoxNzc0NTA5MTU1fQ.O6Y178NpAvH1GUQ-sItFbwd_HeIeY5g1uGVhFufPkm8';

async function testApi() {
  try {
    const res = await axios.get('http://localhost:3001/api/crm/accessible-clinics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('API Error:', err.response?.status, err.response?.data);
  }
}
testApi();
