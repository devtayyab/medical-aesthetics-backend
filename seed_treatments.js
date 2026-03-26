
const { DataSource } = require('typeorm');

async function seed() {
  const ds = new DataSource({
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
    await ds.initialize();
    console.log('DB Connected');

    // 1. Categories
    const categories = [
      { name: 'Injectables', description: 'Fillers, Botox, and other injectables' },
      { name: 'Skin Care', description: 'Facials, peels, and skincare treatments' },
      { name: 'Hair Removal', description: 'Laser and other hair removal systems' },
      { name: 'Body', description: 'Body contouring and toning' },
      { name: 'Dental', description: 'Cosmetic dentistry' },
    ];

    for (const cat of categories) {
      const existing = await ds.query("SELECT id FROM treatment_categories WHERE name = $1", [cat.name]);
      if (existing.length === 0) {
        await ds.query("INSERT INTO treatment_categories (name, description, status, \"isActive\") VALUES ($1, $2, 'approved', true)", [cat.name, cat.description]);
        console.log(`Created category: ${cat.name}`);
      }
    }

    // 2. Treatments (Example set)
    const catMap = {};
    const dbCats = await ds.query("SELECT id, name FROM treatment_categories");
    dbCats.forEach(c => catMap[c.name] = c.id);

    const treatments = [
      { name: 'Botox Anti-Wrinkle', cat: 'Injectables', short: 'Smooth fine lines', full: 'Professional Botox treatment' },
      { name: 'Lip Fillers (1ml)', cat: 'Injectables', short: 'Enhance lip volume', full: 'Hyaluronic acid based fillers' },
      { name: 'HydraFacial', cat: 'Skin Care', short: 'Deep cleansing', full: 'Multi-step professional facial' },
      { name: 'Full Body Laser', cat: 'Hair Removal', short: 'Permanent hair reduction', full: 'Total body laser hair removal' },
    ];

    for (const t of treatments) {
       const existing = await ds.query("SELECT id FROM treatments WHERE name = $1", [t.name]);
       if (existing.length === 0 && catMap[t.cat]) {
          await ds.query(
            "INSERT INTO treatments (name, \"categoryId\", category, \"shortDescription\", \"fullDescription\", status, \"isActive\") VALUES ($1, $2, $3, $4, $5, 'approved', true)", 
            [t.name, catMap[t.cat], t.cat, t.short, t.full]
          );
          console.log(`Created treatment: ${t.name}`);
       }
    }

    await ds.destroy();
    console.log('Seeding complete');
  } catch (err) {
    console.error('Error:', err);
  }
}

seed();
