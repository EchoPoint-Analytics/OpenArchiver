import { db } from '../database';
import * as schema from '../database/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { sql, type SQL } from 'drizzle-orm';
import type { LegalHold } from '@ProofArchive/types';

const mapHold = (h: any): LegalHold => ({
	id: h.id,
	name: h.name,
	reason: h.reason ?? undefined,
	isActive: h.isActive,
	caseId: h.caseId ?? undefined,
	emailCount: 0,
	createdAt: h.createdAt?.toISOString(),
	updatedAt: h.updatedAt?.toISOString(),
});

export class LegalHoldsService {
	async list(): Promise<LegalHold[]> {
		const holds = await db.query.legalHolds.findMany({
			orderBy: [desc(schema.legalHolds.createdAt)],
		});
		return holds.map(mapHold);
	}

	async getById(id: string): Promise<LegalHold | null> {
		const hold = await db.query.legalHolds.findFirst({
			where: eq(schema.legalHolds.id, id),
		});
		return hold ? mapHold(hold) : null;
	}

	async create(data: { name: string; reason?: string; caseId?: string }): Promise<LegalHold> {
		const [hold] = await db.insert(schema.legalHolds).values({
			name: data.name,
			reason: data.reason,
			caseId: data.caseId,
		}).returning();
		return mapHold(hold);
	}

	async update(id: string, data: { name?: string; reason?: string; isActive?: boolean; caseId?: string }): Promise<LegalHold> {
		const [hold] = await db.update(schema.legalHolds).set({
			...data,
			updatedAt: new Date(),
		}).where(eq(schema.legalHolds.id, id)).returning();
		return mapHold(hold);
	}

	async delete(id: string): Promise<void> {
		await db.delete(schema.legalHolds).where(eq(schema.legalHolds.id, id));
	}

	async getLinkedEmailsCount(holdId: string): Promise<number> {
		const countSql: SQL = sql`cast(count(*) as integer)`;
		const result = await db.select({ count: countSql }).from(schema.emailLegalHolds).where(eq(schema.emailLegalHolds.legalHoldId, holdId));
		return (result[0]?.count as unknown as number) ?? 0;
	}

	async linkEmails(holdId: string, emailIds: string[]): Promise<void> {
		await db.insert(schema.emailLegalHolds).values(emailIds.map((emailId) => ({ emailId, legalHoldId: holdId })));
	}

	async unlinkEmails(holdId: string, emailIds: string[]): Promise<void> {
		await db.delete(schema.emailLegalHolds).where(and(eq(schema.emailLegalHolds.legalHoldId, holdId), inArray(schema.emailLegalHolds.emailId, emailIds)));
	}

	async releaseAll(holdId: string): Promise<number> {
		const result = await db.delete(schema.emailLegalHolds).where(eq(schema.emailLegalHolds.legalHoldId, holdId)).returning();
		return result.length;
	}
}
