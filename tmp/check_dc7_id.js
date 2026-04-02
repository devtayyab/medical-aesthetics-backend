const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
client.connect().then(async () => {
    const id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230';
    try {
        const uRes = await client.query('SELECT id FROM users WHERE id = $1', [id]);
        console.log('User found:', !!uRes.rows[0]);
        const lRes = await client.query('SELECT id FROM leads WHERE id = $1', [id]);
        console.log('Lead found:', !!lRes.rows[0]);
        const exRes = await client.query('SELECT id FROM leads WHERE "externalLeadId" = $1', [id]);
        console.log('Lead found by externalLeadId:', !!exRes.rows[0]);
        const rRes = await client.query('SELECT id FROM customer_records WHERE id = $1', [id]);
        console.log('Record found:', !!rRes.rows[0]);
    } catch (e) { console.error(e); }
    process.exit();
});
