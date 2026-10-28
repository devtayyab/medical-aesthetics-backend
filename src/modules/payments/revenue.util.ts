import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { PaymentRecord, PaymentStatus, PaymentType } from './entities/payment-record.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

/**
 * Single source of truth for "revenue" across the platform (admin Payments, Dashboard,
 * Sales Analytics, Clinic Analytics, CRM Reports and the clinic/doctor revenue pages).
 *
 * Definition (all pages MUST use it, never appointment.totalAmount):
 *  - Source: payment_records only (money actually received). Unpaid / future visits never count.
 *  - Currency: EUR only.
 *  - Net: payments + deposits, minus refunds and voids. The original payment of a refund keeps
 *    status REFUNDED/VOIDED and is still added, while the refund/void record subtracts it, so a
 *    fully refunded payment nets to 0.
 *  - Payments of soft-deleted appointments (status DELETED) are excluded.
 *  - Period: by payment date (payment.createdAt).
 */
export const REVENUE_PAYMENT_STATUSES = [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.VOIDED];
export const REVENUE_CURRENCY = 'EUR';

export interface RevenueFilters {
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  clinicId?: string | null;
  clinicIds?: string[] | null;
  providerId?: string | null;
  salespersonId?: string | null;
  clientId?: string | null;
}

export function netPaidExpression(alias = 'p'): string {
  return `COALESCE(SUM(CASE
      WHEN ${alias}.type IN ('${PaymentType.PAYMENT}', '${PaymentType.DEPOSIT}') THEN ${alias}.amount
      WHEN ${alias}.type IN ('${PaymentType.REFUND}', '${PaymentType.VOID}') THEN -${alias}.amount
      ELSE 0
    END), 0)`;
}

function toDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Base query over payment_records with the shared revenue rules and the given filters applied. */
export function buildPaidRevenueQuery(
  manager: EntityManager,
  filters: RevenueFilters = {},
  alias = 'p',
): SelectQueryBuilder<PaymentRecord> {
  const qb = manager
    .getRepository(PaymentRecord)
    .createQueryBuilder(alias)
    .leftJoin(`${alias}.appointment`, `${alias}_apt`)
    .where(`${alias}.status IN (:...revenueStatuses)`, { revenueStatuses: REVENUE_PAYMENT_STATUSES })
    .andWhere(`COALESCE(${alias}.currency, :revenueCurrency) = :revenueCurrency`, { revenueCurrency: REVENUE_CURRENCY })
    .andWhere(`(${alias}_apt.id IS NULL OR ${alias}_apt.status != :revenueDeleted)`, { revenueDeleted: AppointmentStatus.DELETED });

  const start = toDate(filters.startDate);
  const end = toDate(filters.endDate);
  if (start) qb.andWhere(`${alias}.createdAt >= :revenueStart`, { revenueStart: start });
  if (end) qb.andWhere(`${alias}.createdAt <= :revenueEnd`, { revenueEnd: end });
  if (filters.clinicId) qb.andWhere(`${alias}.clinicId = :revenueClinicId`, { revenueClinicId: filters.clinicId });
  if (filters.clinicIds) {
    if (filters.clinicIds.length === 0) qb.andWhere('1=0');
    else qb.andWhere(`${alias}.clinicId IN (:...revenueClinicIds)`, { revenueClinicIds: filters.clinicIds });
  }
  if (filters.providerId) qb.andWhere(`${alias}.providerId = :revenueProviderId`, { revenueProviderId: filters.providerId });
  if (filters.salespersonId) qb.andWhere(`${alias}.salespersonId = :revenueSalespersonId`, { revenueSalespersonId: filters.salespersonId });
  if (filters.clientId) qb.andWhere(`${alias}.clientId = :revenueClientId`, { revenueClientId: filters.clientId });
  return qb;
}

/** Net paid revenue (EUR) for the filters. */
export async function getPaidRevenueTotal(manager: EntityManager, filters: RevenueFilters = {}): Promise<number> {
  const row = await buildPaidRevenueQuery(manager, filters, 'p')
    .select(`${netPaidExpression('p')}`, 'net')
    .getRawOne();
  return Number(row?.net ?? 0) || 0;
}

/** Net paid revenue (EUR) grouped by clinicId / salespersonId / providerId / clientId. */
export async function getPaidRevenueBy(
  manager: EntityManager,
  groupBy: 'clinicId' | 'salespersonId' | 'providerId' | 'clientId',
  filters: RevenueFilters = {},
): Promise<Map<string, number>> {
  const rows = await buildPaidRevenueQuery(manager, filters, 'p')
    .select(`p.${groupBy}`, 'key')
    .addSelect(`${netPaidExpression('p')}`, 'net')
    .groupBy(`p.${groupBy}`)
    .getRawMany();
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.key) map.set(String(r.key), Number(r.net ?? 0) || 0);
  }
  return map;
}

/** Net paid revenue (EUR) per Athens calendar day (yyyy-MM-dd). */
export async function getPaidRevenueByDay(
  manager: EntityManager,
  filters: RevenueFilters = {},
  timezone = 'Europe/Athens',
): Promise<Map<string, number>> {
  const rows = await buildPaidRevenueQuery(manager, filters, 'p')
    .select(`to_char(p.createdAt AT TIME ZONE :revenueTz, 'YYYY-MM-DD')`, 'day')
    .addSelect(`${netPaidExpression('p')}`, 'net')
    .setParameter('revenueTz', timezone)
    .groupBy('day')
    .getRawMany();
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r.day), Number(r.net ?? 0) || 0);
  return map;
}
