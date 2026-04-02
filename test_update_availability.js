const axios = require('axios');

async function testUpdateAvailability() {
  const token = 'YOUR_JWT_TOKEN'; // I'll replace this
  const clinicId = '1f0c099e-663f-462a-bd8d-b90ad71cbb01';
  
  try {
    const res = await axios.put('http://localhost:3001/api/clinic/availability', {
      clinicId,
      businessHours: {
        monday: { open: "08:00", close: "18:00", isOpen: true },
        tuesday: { open: "08:00", close: "18:00", isOpen: true },
        wednesday: { open: "08:00", close: "18:00", isOpen: true },
        thursday: { open: "08:00", close: "18:00", isOpen: true },
        friday: { open: "08:00", close: "18:00", isOpen: true },
        saturday: { open: "10:00", close: "14:00", isOpen: true },
        sunday: { open: "10:00", close: "14:00", isOpen: false }
      },
      timezone: "Europe/Athens"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', res.data.name);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data);
  }
}
// I need current token
