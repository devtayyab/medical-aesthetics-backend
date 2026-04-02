
const { DataSource } = require('typeorm');

async function check() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'medical_aesthetics',
    synchronize: false,
    logging: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('DB Connected');

    const categories = await AppDataSource.query('SELECT * FROM treatment_categories');
    console.log(`\nTotal Categories: ${categories.length}`);
    categories.forEach(c => console.log(` - [${c.status}] ${c.name} (ID: ${c.id}, Active: ${c.isActive})`));

    const treatments = await AppDataSource.query('SELECT id, name, status, "isActive", "categoryId" FROM treatments LIMIT 20');
    console.log(`\nTreatments (first 20):`);
    treatments.forEach(t => console.log(` - [${t.status}] ${t.name} (ID: ${t.id}, Active: ${t.isActive}, CatID: ${t.categoryId})`));

    const services = await AppDataSource.query('SELECT s.id, t.name as tname, s."isActive", s."clinicId" FROM services s LEFT JOIN treatments t ON s."treatmentId" = t.id LIMIT 10');
    console.log(`\nServices (first 10):`);
    services.forEach(s => console.log(` - ${s.tname} (ID: ${s.id}, Active: ${s.isActive}, ClinicID: ${s.clinicId})`));

    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
