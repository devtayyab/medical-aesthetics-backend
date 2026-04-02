
const { DataSource } = require('typeorm');
const fs = require('fs');
async function check() {
  const ds = new DataSource({ type: 'postgres', host: 'localhost', port: 5432, username: 'postgres', password: 'postgres', database: 'medical_aesthetics', synchronize: false });
  await ds.initialize();
  const treatments = await ds.query("SELECT * FROM treatments");
  fs.writeFileSync('tmp/treatments_dump.json', JSON.stringify(treatments, null, 2), 'utf8');
  await ds.destroy();
}
check();
