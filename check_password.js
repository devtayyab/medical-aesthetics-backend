const bcrypt = require('bcrypt');
const hash = '$2b$12$tJIjkj2Ipv.jIoXCvXkCHOT.am/RtVoKB/K9AIteR9eBXjzg88dHy';
const candidate = 'SuperAdmin123!';

async function check() {
  const match = await bcrypt.compare(candidate, hash);
  console.log('Password match?', match);
}

check();
