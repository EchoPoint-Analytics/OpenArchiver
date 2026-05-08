import { db } from '../database';
import * as schema from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import type { RetentionPolicy, PolicyEvaluationResult } from '@ProofArchive/types';

const mapPolicy = (p: any): RetentionPolicy => ({
	id: p.id,
	name: p.name,
	description: p.description ?? undefined,
	priority: p.priority,
	conditions: p.conditions ?? null,
	ingestionScope: p.ingestionScope ?? null,
	retentionPeriodDays: p.retentionPeriodDays,
	isActive: p.isEnabled,
	createdAt: p.createdAt?.toISOString(),
	updatedAt: p.updatedAt?.toISOString(),
});

export class RetentionPolicyService {
	async list(): Promise<RetentionPolicy[]> {
		const policies = await db.query.retentionPolicies.findMany({
			orderBy: [desc(schema.retentionPolicies.priority)],
		});
		return policies.map(mapPolicy);
	}

	async getById(id: string): Promise<RetentionPolicy | null> {
		const p = await db.query.retentionPolicies.findFirst({
			where: eq(schema.retentionPolicies.id, id),
		});
		return p ? mapPolicy(p) : null;
	}

	async create(data: {
		name: string;
		description?: string;
		priority: number;
		retentionPeriodDays: number;
		actionOnExpiry: 'delete_permanently' | 'notify_admin';
		isEnabled: boolean;
		conditions?: object | null;
		ingestionScope?: string[] | null;
	}): Promise<RetentionPolicy> {
		const [p] = await db.insert(schema.retentionPolicies).values({
			name: data.name,
			description: data.description,
			priority: data.priority,
			retentionPeriodDays: data.retentionPeriodDays,
			actionOnExpiry: data.actionOnExpiry,
			isEnabled: data.isEnabled,
			conditions: data.conditions ?? null,
			ingestionScope: data.ingestionScope ?? null,
		}).returning();
		return mapPolicy(p);
	}

	async update(
		id: string,
		data: {
			name?: string;
			description?: string;
			priority?: number;
			retentionPeriodDays?: number;
			actionOnExpiry?: 'delete_permanently' | 'notify_admin';
			isEnabled?: boolean;
			conditions?: object | null;
			ingestionScope?: string[] | null;
		}
	): Promise<RetentionPolicy> {
		const [p] = await db
			.update(schema.retentionPolicies)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(schema.retentionPolicies.id, id))
			.returning();
		return mapPolicy(p);
	}

	async delete(id: string): Promise<void> {
		await db.delete(schema.retentionPolicies).where(eq(schema.retentionPolicies.id, id));
	}

	async evaluatePolicies(emailMetadata: {
		sender?: string;
		recipients?: string[];
		subject?: string;
		attachmentTypes?: string[];
		ingestionSourceId?: string;
	}): Promise<PolicyEvaluationResult> {
		const policies = await this.list();
		const enabled = policies.filter((p) => p.isActive);

		for (const policy of enabled) {
			const conditions = policy.conditions;
			if (!conditions || !conditions.rules || conditions.rules.length === 0) {
				return {
					appliedRetentionDays: policy.retentionPeriodDays,
					actionOnExpiry: 'delete_permanently',
					matchingPolicyIds: [policy.id],
				};
			}

			let matches = conditions.logicalOperator === 'AND';
			for (const rule of conditions.rules) {
				let value: string | undefined;
				if (rule.field === 'sender') value = emailMetadata.sender;
				else if (rule.field === 'recipient') value = emailMetadata.recipients?.join(', ');
				else if (rule.field === 'subject') value = emailMetadata.subject;
				else if (rule.field === 'attachment_type') value = emailMetadata.attachmentTypes?.join(', ');

				let ruleMatches = false;
				const op = rule.operator;
				if (op === 'equals' && value === rule.value) ruleMatches = true;
				else if (op === 'contains' && value?.includes(rule.value)) ruleMatches = true;
				else if (op === 'starts_with' && value?.startsWith(rule.value)) ruleMatches = true;
				else if (op === 'ends_with' && value?.endsWith(rule.value)) ruleMatches = true;

				if (conditions.logicalOperator === 'AND') matches = matches && ruleMatches;
				else matches = matches || ruleMatches;
			}

			if (matches) {
				return {
					appliedRetentionDays: policy.retentionPeriodDays,
					actionOnExpiry: 'delete_permanently',
					matchingPolicyIds: [policy.id],
				};
			}
		}

		return {
			appliedRetentionDays: 0,
			actionOnExpiry: 'delete_permanently',
			matchingPolicyIds: [],
		};
	}
}
