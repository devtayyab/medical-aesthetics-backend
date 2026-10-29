/**
 * Deletes the duplicate "Facebook Form Submission - Follow Up" CRM tasks that the
 * Facebook sync created on every 30-minute run (~24,000 junk tasks).
 *
 * For every customer it KEEPS ONE task:
 *   1. a task someone already worked on (status not pending, a call outcome or
 *      completion recorded, or edited after creation), newest first; otherwise
 *   2. the oldest pending task (the original submission).
 * All other copies for that customer are deleted. Tasks with other titles are
 * never touched.
 *
 * Optional --include-comm-logs also removes the duplicate "Facebook Lead Form
 * Submission" notes logged by the same runs (same customer + same Facebook lead
 * id), keeping the oldest one.
 *
 * DRY RUN by default: prints what would be deleted and changes nothing.
 *
 *   npx ts-node -r tsconfig-paths/register src/scripts/cleanup-duplicate-facebook-followup-tasks.ts
 *   npx ts-node -r tsconfig-paths/register src/scripts/cleanup-duplicate-facebook-followup-tasks.ts --apply
 *   ... --apply --include-comm-logs
 *
 * Uses the DATABASE_* variables from .env (src/config/data-source.ts).
 */
import AppDataSource from '../config/data-source';

const TASK_TITLE = 'Facebook Form Submission - Follow Up';
const COMM_SUBJECT = 'Facebook Lead Form Submission';

async function main() {
  const apply = process.argv.includes('--apply');
  const includeCommLogs = process.argv.includes('--include-comm-logs');

  AppDataSource.setOptions({ logging: false });
  await AppDataSource.initialize();

  try {
    console.log(`Mode: ${apply ? 'APPLY (deleting)' : 'DRY RUN (no changes)'}`);

    const totals = await AppDataSource.query(
      `SELECT COUNT(*)::int AS total, COUNT(DISTINCT "customerId")::int AS customers
         FROM crm_actions WHERE title = $1`,
      [TASK_TITLE],
    );
    console.log(`"${TASK_TITLE}" tasks: ${totals[0].total} for ${totals[0].customers} customers`);

    // Rank the copies per customer: worked-on tasks first (newest), then the oldest pending one
    const toDelete: Array<{ id: string; customerId: string; status: string; createdAt: Date }> = await AppDataSource.query(
      `WITH ranked AS (
         SELECT id, "customerId", status, "createdAt",
                ROW_NUMBER() OVER (
                  PARTITION BY COALESCE("customerId"::text, id::text)
                  ORDER BY
                    CASE WHEN status::text <> 'pending'
                           OR COALESCE("callOutcome", '') <> ''
                           OR "completedAt" IS NOT NULL
                           OR "updatedAt" > "createdAt" + INTERVAL '1 minute'
                         THEN 0 ELSE 1 END,
                    CASE WHEN status::text <> 'pending' THEN "updatedAt" END DESC NULLS LAST,
                    "createdAt" ASC
                ) AS rn
           FROM crm_actions
          WHERE title = $1
       )
       SELECT id, "customerId", status, "createdAt" FROM ranked WHERE rn > 1`,
      [TASK_TITLE],
    );

    console.log(`Duplicate tasks to delete: ${toDelete.length}`);
    const perCustomer = new Map<string, number>();
    for (const t of toDelete) perCustomer.set(t.customerId, (perCustomer.get(t.customerId) || 0) + 1);
    const top = [...perCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [customerId, n] of top) console.log(`  customer ${customerId}: ${n} copies`);
    if (toDelete.length > 0) {
      console.log('  sample ids:', toDelete.slice(0, 5).map((t) => t.id).join(', '));
    }

    let commLogIds: string[] = [];
    if (includeCommLogs) {
      const rows: Array<{ id: string }> = await AppDataSource.query(
        `WITH ranked AS (
           SELECT id,
                  ROW_NUMBER() OVER (
                    PARTITION BY "customerId", (metadata::jsonb ->> 'facebookLeadId')
                    ORDER BY "createdAt" ASC
                  ) AS rn
             FROM communication_logs
            WHERE subject = $1 AND metadata::jsonb ->> 'facebookLeadId' IS NOT NULL
         )
         SELECT id FROM ranked WHERE rn > 1`,
        [COMM_SUBJECT],
      );
      commLogIds = rows.map((r) => r.id);
      console.log(`Duplicate "${COMM_SUBJECT}" notes to delete: ${commLogIds.length}`);
    }

    if (!apply) {
      console.log('\nDry run only. Re-run with --apply to delete.');
      return;
    }

    const ids = toDelete.map((t) => t.id);
    let deleted = 0;
    for (let i = 0; i < ids.length; i += 1000) {
      const chunk = ids.slice(i, i + 1000);
      await AppDataSource.query(`DELETE FROM crm_actions WHERE id = ANY($1) AND title = $2`, [chunk, TASK_TITLE]);
      deleted += chunk.length;
    }
    console.log(`Deleted ${deleted} duplicate tasks.`);

    let deletedLogs = 0;
    for (let i = 0; i < commLogIds.length; i += 1000) {
      const chunk = commLogIds.slice(i, i + 1000);
      await AppDataSource.query(`DELETE FROM communication_logs WHERE id = ANY($1) AND subject = $2`, [chunk, COMM_SUBJECT]);
      deletedLogs += chunk.length;
    }
    if (includeCommLogs) console.log(`Deleted ${deletedLogs} duplicate notes.`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
