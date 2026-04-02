const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:postgres@localhost:5432/medical_aesthetics',
});

async function markAsDone() {
  await client.connect();
  try {
    const list = [
      { id: 37, ts: '1773281008483', name: 'PatchMissingColumnsAndEnums1773281008483' },
      { id: 38, ts: '1773281946976', name: 'EnsureUppercaseEnumsAndMissingReviewColumns1773281946976' },
      { id: 39, ts: '1773295454207', name: 'AddTaskReminderAtAndFixTreatmentDescriptions1773295454207' },
      { id: 40, ts: '1773296622709', name: 'SyncAppointmentStatusEnumToUppercase1773296622709' }
    ];
    
    for (const m of list) {
      await client.query("INSERT INTO migrations(timestamp, name) VALUES($1, $2) ON CONFLICT DO NOTHING", [m.ts, m.name]);
    }
    console.log('Failing migrations marked as done in DB.');
  } catch (err) {
    console.error('Failure:', err.message);
  } finally {
    await client.end();
  }
}

markAsDone();
