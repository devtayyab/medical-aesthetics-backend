import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectDataSource()
        private dataSource: DataSource
    ) { }

    async getLedger(query: { type?: string; date?: string; limit?: number; offset?: number }) {
        const limit = query.limit || 50;
        const offset = query.offset || 0;

        // We use a UNION ALL query to combine appointments and gift cards into a single ledger stream
        let sql = `
      SELECT 
        id, 
        'appointment' AS "type", 
        "createdAt" AS "date", 
        "totalAmount" AS "amount", 
        "paymentMethod" AS "method", 
        "status", 
        "clientId" AS "userId",
        "notes" AS "description"
      FROM appointments 
      WHERE "status" IN ('completed', 'confirmed') AND ("totalAmount" > 0 OR "amountPaid" > 0)
      
      UNION ALL
      
      SELECT 
        id, 
        'gift_card' AS "type", 
        "createdAt" AS "date", 
        "amount" AS "amount", 
        'System' AS "method", 
        'completed' AS "status", 
        "userId" AS "userId",
        'Gift Card Purchase (' || code || ')' AS "description"
      FROM gift_cards
    `;

        // Wrapping in a subquery to allow overall sorting and filtering
        let wrapperSql = `SELECT * FROM (${sql}) AS ledger WHERE 1=1`;
        const params: any[] = [];
        let paramIndex = 1;

        if (query.type && query.type !== 'All Types') {
            let filterType = query.type;
            if (query.type === 'Appointment (Prepaid)') filterType = 'appointment';
            if (query.type === 'Gift Card') filterType = 'gift_card';

            if (filterType === 'appointment' || filterType === 'gift_card') {
                wrapperSql += ` AND "type" = $${paramIndex++}`;
                params.push(filterType);
            }
        }

        if (query.date) {
            wrapperSql += ` AND DATE("date") = $${paramIndex++}`;
            params.push(query.date);
        }

        wrapperSql += ` ORDER BY "date" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const rawResults = await this.dataSource.query(wrapperSql, params);

        // Fetch user details for the userId
        if (rawResults.length > 0) {
            const userIds = [...new Set(rawResults.map((r: any) => r.userId).filter(Boolean))];
            if (userIds.length > 0) {
                const users = await this.dataSource.query(
                    `SELECT id, "firstName", "lastName", email FROM users WHERE id = ANY($1)`,
                    [userIds]
                );
                const userMap = users.reduce((acc: any, u: any) => {
                    acc[u.id] = u;
                    return acc;
                }, {});

                for (const row of rawResults) {
                    if (row.userId && userMap[row.userId]) {
                        row.user = userMap[row.userId];
                    }
                }
            }
        }

        return rawResults;
    }
}
