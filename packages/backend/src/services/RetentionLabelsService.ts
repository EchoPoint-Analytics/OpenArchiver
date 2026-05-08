import { db } from '../database';
import * as schema from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { RetentionLabel } from '@ProofArchive/types';

const mapLabel = (l: any): RetentionLabel => ({
	id: l.id,
	name: l.name,
	retentionPeriodDays: l.retentionPeriodDays,
	description: l.description ?? undefined,
	isDisabled: l.isDisabled,
	appliedEmailCount: 0,
	createdAt: l.createdAt?.toISOString(),
});

export class RetentionLabelsService {
	async list(): Promise<RetentionLabel[]> {
		const labels = await db.query.retentionLabels.findMany({
			orderBy: [desc(schema.retentionLabels.createdAt)],
		});
		return labels.map(mapLabel);
	}

	async getById(id: string): Promise<RetentionLabel | null> {
		const label = await db.query.retentionLabels.findFirst({
			where: eq(schema.retentionLabels.id, id),
		});
		return label ? mapLabel(label) : null;
	}

	async create(data: { name: string; retentionPeriodDays: number; description?: string }): Promise<RetentionLabel> {
		const [label] = await db.insert(schema.retentionLabels).values({
			name: data.name,
			retentionPeriodDays: data.retentionPeriodDays,
			description: data.description,
		}).returning();
		return mapLabel(label);
	}

	async update(
		id: string,
		data: { name?: string; retentionPeriodDays?: number; description?: string; isDisabled?: boolean }
	): Promise<RetentionLabel> {
		const [label] = await db
			.update(schema.retentionLabels)
			.set(data)
			.where(eq(schema.retentionLabels.id, id))
			.returning();
		return mapLabel(label);
	}

	async delete(id: string): Promise<void> {
		await db.delete(schema.retentionLabels).where(eq(schema.retentionLabels.id, id));
	}

	async applyToEmail(labelId: string, emailId: string, userId: string): Promise<void> {
		await db
			.insert(schema.emailRetentionLabels)
			.values({ labelId, emailId, appliedByUserId: userId })
			.onConflictDoNothing();
	}

	async removeFromEmail(labelId: string, emailId: string): Promise<void> {
		await db.delete(schema.emailRetentionLabels).where(
			sql`${schema.emailRetentionLabels.labelId} = ${labelId} AND ${schema.emailRetentionLabels.emailId} = ${emailId}`
		);
	}
}
