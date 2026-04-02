const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medical_aesthetics' });
client.connect().then(async () => {
    const id = 'dc7aff3b-8b96-45d3-b2c2-ff164cfcd230';
    console.log('Searching for ID:', id);
    try {
        const tables = ['users', 'leads', 'customer_records', 'crm_actions', 'communication_logs', 'appointments'];
        for (const table of tables) {
            const res = await client.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
            if (res.rows[0]) console.log(`ID FOUND in table: ${table}`);
        }
    } catch (e) {
        console.error(e.message);
    }
    process.exit();
});
