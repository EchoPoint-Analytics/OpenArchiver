import { Request, Response } from 'express';
import { AuditService } from '../../services/AuditService';
import { LicenseService } from '../../services/LicenseService';
import { GetAuditLogsOptions } from '@ProofArchive/types';

const auditService = new AuditService();
const licenseService = new LicenseService();

/**
 * GET /enterprise/audit-logs
 * Returns paginated audit log entries with optional filtering.
 */
export const getAuditLogs = async (req: Request, res: Response) => {
	const {
		page = '1',
		limit = '50',
		startDate,
		endDate,
		actor,
		actionType,
		targetType,
		sort = 'desc',
	} = req.query;

	const options: GetAuditLogsOptions = {
		page: parseInt(String(page), 10),
		limit: parseInt(String(limit), 10),
		startDate: startDate ? new Date(String(startDate)) : undefined,
		endDate: endDate ? new Date(String(endDate)) : undefined,
		actor: actor ? String(actor) : undefined,
		actionType: actionType ? String(actionType) as any : undefined,
		targetType: targetType ? String(targetType) as any : undefined,
		sort: sort === 'asc' ? 'asc' : 'desc',
	};

	const result = await auditService.getAuditLogs(options);
	res.json(result);
};

/**
 * POST /enterprise/audit-logs/verify
 * Verifies the hash chain integrity of the audit log.
 */
export const verifyAuditLogs = async (req: Request, res: Response) => {
	const isValid = await auditService.verifyHashChain();
	if (isValid) {
		res.json({ valid: true, message: 'Audit log integrity verified.' });
	} else {
		res.status(400).json({ valid: false, message: 'Audit log integrity check failed.' });
	}
};

/**
 * GET /enterprise/status/license-status
 * Returns the consolidated license status for the admin UI.
 */
export const getLicenseStatus = async (req: Request, res: Response) => {
	const status = await licenseService.getConsolidatedStatus();
	res.json(status);
};

/**
 * POST /enterprise/license/generate-demo
 * Generates a demo license.jwt for testing purposes.
 * Protected — only accessible via internal network in production.
 */
export const generateDemoLicense = async (req: Request, res: Response) => {
	const { customerName, planSeats, expiresAt } = req.body;
	if (!customerName || !planSeats || !expiresAt) {
		return res.status(400).json({ message: 'customerName, planSeats, and expiresAt are required.' });
	}
	const token = await licenseService.generateDemoLicense(customerName, parseInt(String(planSeats), 10), new Date(expiresAt));
	res.json({ token });
};
