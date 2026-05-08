import * as fs from 'fs';
import * as path from 'path';
import { jwtVerify, SignJWT } from 'jose';
import type { LicenseFilePayload, LicenseStatusPayload, ConsolidatedLicenseStatus } from '@ProofArchive/types';
import { ProofArchiveFeature } from '@ProofArchive/types';
import { config } from '../config';
import { db } from '../database';
import { ingestionSources } from '../database/schema';

const LICENSE_FILE = 'license.jwt';
const STATUS_CACHE_FILE = 'license-status.json';
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'proofarchivsender-enterprise-secret-key-2026';

/**
 * Returns the path to the enterprise storage directory.
 */
function getEnterpriseDir(): string {
	const storageDir = config.storage.type === 'local'
		? path.join((config.storage as any).rootPath, (config.storage as any).openArchiverFolderName, 'enterprise')
		: path.join((config.storage as any).rootPath, 'enterprise');
	if (!fs.existsSync(storageDir)) {
		fs.mkdirSync(storageDir, { recursive: true });
	}
	return storageDir;
}

export class LicenseService {
	private cachedLicense: LicenseFilePayload | null = null;

	/**
	 * Load and verify the offline license.jwt file from the storage directory.
	 */
	public async loadLicenseFile(): Promise<LicenseFilePayload | null> {
		if (this.cachedLicense) return this.cachedLicense;

		const licensePath = path.join(getEnterpriseDir(), LICENSE_FILE);
		if (!fs.existsSync(licensePath)) {
			return null;
		}

		try {
			const token = fs.readFileSync(licensePath, 'utf-8').trim();
			const secret = new TextEncoder().encode(LICENSE_SECRET);
			const { payload } = await jwtVerify(token, secret);
			this.cachedLicense = payload as unknown as LicenseFilePayload;
			return this.cachedLicense;
		} catch (err) {
			console.error('[LicenseService] Failed to verify license.jwt:', err);
			return null;
		}
	}

	/**
	 * Load cached license status (last phone-home result).
	 */
	public loadCachedStatus(): LicenseStatusPayload | null {
		const cachePath = path.join(getEnterpriseDir(), STATUS_CACHE_FILE);
		if (!fs.existsSync(cachePath)) return null;
		try {
			return JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as LicenseStatusPayload;
		} catch {
			return null;
		}
	}

	/**
	 * Save the phone-home result to the cache file.
	 */
	public saveCachedStatus(status: LicenseStatusPayload): void {
		const cachePath = path.join(getEnterpriseDir(), STATUS_CACHE_FILE);
		fs.writeFileSync(cachePath, JSON.stringify(status, null, 2));
	}

	/**
	 * Count active ingestion sources (unique archived mailboxes = seat usage).
	 */
	public async getActiveSeats(): Promise<number> {
		const sources = await db.select({ id: ingestionSources.id }).from(ingestionSources);
		return sources.length;
	}

	/**
	 * Build the consolidated license status object for the admin UI.
	 */
	public async getConsolidatedStatus(): Promise<ConsolidatedLicenseStatus> {
		const license = await this.loadLicenseFile();
		const cached = this.loadCachedStatus();
		const activeSeats = await this.getActiveSeats();

		if (!license) {
			return {
				customerName: 'Unknown',
				planSeats: 0,
				expiresAt: new Date().toISOString(),
				remoteStatus: 'UNKNOWN',
				activeSeats,
				isExpired: true,
				features: {},
			};
		}

		const now = new Date();
		const expiresAt = new Date(license.expiresAt);
		const isExpired = expiresAt < now;

		// All features are enabled for a valid license
		const features: Record<ProofArchiveFeature, boolean> = {
			[ProofArchiveFeature.AUDIT_LOG]: true,
			[ProofArchiveFeature.RETENTION_POLICY]: true,
			[ProofArchiveFeature.LEGAL_HOLDS]: true,
			[ProofArchiveFeature.INTEGRITY_REPORT]: true,
			[ProofArchiveFeature.JOURNALING]: true,
			[ProofArchiveFeature.SSO]: license.features.includes(ProofArchiveFeature.SSO),
			[ProofArchiveFeature.STATUS]: true,
			[ProofArchiveFeature.ALL]: license.features.includes(ProofArchiveFeature.ALL),
		};

		return {
			customerName: license.customerName,
			planSeats: license.planSeats,
			expiresAt: license.expiresAt,
			remoteStatus: cached?.status ?? 'UNKNOWN',
			gracePeriodEnds: cached?.gracePeriodEnds,
			lastCheckedAt: cached?.lastCheckedAt,
			message: cached?.message,
			activeSeats,
			isExpired,
			features,
		};
	}

	/**
	 * Generate a new demo license.jwt for testing.
	 * In production this would come from a license server.
	 */
	public async generateDemoLicense(customerName: string, planSeats: number, expiresAt: Date): Promise<string> {
		const secret = new TextEncoder().encode(LICENSE_SECRET);
		const payload = {
			licenseId: 'demo-license-001',
			customerName,
			planSeats,
			features: [
				ProofArchiveFeature.AUDIT_LOG,
				ProofArchiveFeature.RETENTION_POLICY,
				ProofArchiveFeature.LEGAL_HOLDS,
				ProofArchiveFeature.INTEGRITY_REPORT,
				ProofArchiveFeature.JOURNALING,
				ProofArchiveFeature.STATUS,
			],
			expiresAt: expiresAt.toISOString(),
			issuedAt: new Date().toISOString(),
		};
		const token = await new SignJWT(payload)
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime(expiresAt)
			.sign(secret);

		const licensePath = path.join(getEnterpriseDir(), LICENSE_FILE);
		fs.writeFileSync(licensePath, token);
		this.cachedLicense = null; // reset cache

		return token;
	}
}
