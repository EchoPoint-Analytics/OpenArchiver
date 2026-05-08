import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireEnterpriseMode } from '../middleware/requireEnterpriseMode';
import { AuthService } from '../../services/AuthService';
import {
	getAuditLogs,
	verifyAuditLogs,
	getLicenseStatus,
	generateDemoLicense,
} from '../controllers/enterprise.controller';

export const createEnterpriseRouter = (authService: AuthService): Router => {
	const router = Router();

	// All enterprise routes require authentication AND enterprise mode
	router.use(requireAuth(authService));
	router.use(requireEnterpriseMode);

	/**
	 * @openapi
	 * /v1/enterprise/audit-logs:
	 *   get:
	 *     summary: List audit log entries
	 *     description: Returns paginated audit log entries with optional filtering. Requires `read:audit-log` permission.
	 *     operationId: getAuditLogs
	 *     tags:
	 *       - Enterprise
	 *     security:
	 *       - bearerAuth: []
	 *       - apiKeyAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           default: 1
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           default: 50
	 *       - in: query
	 *         name: startDate
	 *         schema:
	 *           type: string
	 *           format: date-time
	 *       - in: query
	 *         name: endDate
	 *         schema:
	 *           type: string
	 *           format: date-time
	 *       - in: query
	 *         name: actor
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: actionType
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: targetType
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: sort
	 *         schema:
	 *           type: string
	 *           enum: [asc, desc]
	 *           default: desc
	 *     responses:
	 *       '200':
	 *         description: Paginated audit log entries
	 *       '401':
	 *         $ref: '#/components/responses/Unauthorized'
	 *       '403':
	 *         $ref: '#/components/responses/Forbidden'
	 */
	router.get('/audit-logs', getAuditLogs);

	/**
	 * @openapi
	 * /v1/enterprise/audit-logs/verify:
	 *   post:
	 *     summary: Verify audit log integrity
	 *     description: Verifies the hash chain integrity of the audit log. Requires `read:audit-log` permission.
	 *     operationId: verifyAuditLogs
	 *     tags:
	 *       - Enterprise
	 *     security:
	 *       - bearerAuth: []
	 *       - apiKeyAuth: []
	 *     responses:
	 *       '200':
	 *         description: Verification result
	 *       '401':
	 *         $ref: '#/components/responses/Unauthorized'
	 *       '403':
	 *         $ref: '#/components/responses/Forbidden'
	 */
	router.post('/audit-logs/verify', verifyAuditLogs);

	/**
	 * @openapi
	 * /v1/enterprise/status/license-status:
	 *   get:
	 *     summary: Get license status
	 *     description: Returns the consolidated license status for the admin UI. Requires `read:license` permission.
	 *     operationId: getLicenseStatus
	 *     tags:
	 *       - Enterprise
	 *     security:
	 *       - bearerAuth: []
	 *       - apiKeyAuth: []
	 *     responses:
	 *       '200':
	 *         description: Consolidated license status
	 *       '401':
	 *         $ref: '#/components/responses/Unauthorized'
	 *       '403':
	 *         $ref: '#/components/responses/Forbidden'
	 */
	router.get('/status/license-status', getLicenseStatus);

	/**
	 * @openapi
	 * /v1/enterprise/license/generate-demo:
	 *   post:
	 *     summary: Generate demo license
	 *     description: Creates a demo license.jwt for testing. Requires `manage:license` permission.
	 *     operationId: generateDemoLicense
	 *     tags:
	 *       - Enterprise
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required: [customerName, planSeats, expiresAt]
	 *             properties:
	 *               customerName:
	 *                 type: string
	 *               planSeats:
	 *                 type: integer
	 *               expiresAt:
	 *                 type: string
	 *                 format: date-time
	 *     responses:
	 *       '200':
	 *         description: Generated license token
	 *       '400':
	 *         description: Invalid request body
	 *       '401':
	 *         $ref: '#/components/responses/Unauthorized'
	 */
	router.post('/license/generate-demo', generateDemoLicense);

	return router;
};
