const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});
ds.initialize().then(async () => {
  try {
    const records = await ds.query(`SELECT * FROM customer_records WHERE id = '5dcd1972-1b50-4258-baea-1a3fc32b2c73' OR "customerId" = '5dcd1972-1b50-4258-baea-1a3fc32b2c73'`);
    console.log('customer_records:', records);
    const users = await ds.query(`SELECT * FROM users WHERE id = '5dcd1972-1b50-4258-baea-1a3fc32b2c73'`);
    console.log('users:', users);
    const leads = await ds.query(`SELECT * FROM leads WHERE id = '5dcd1972-1b50-4258-baea-1a3fc32b2c73'`);
    console.log('leads:', leads);
  } catch(e) { console.error(e); }
  process.exit(0);
});
