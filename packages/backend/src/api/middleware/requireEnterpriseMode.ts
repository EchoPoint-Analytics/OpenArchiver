import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware that blocks requests when enterprise mode is not enabled.
 * Used to protect enterprise API routes that are not part of the OSS build.
 */
export const requireEnterpriseMode = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (!req.app.locals?.enterpriseMode) {
		return res.status(403).json({
			message: 'This feature is only available in the Enterprise Edition.',
		});
	}
	// Also set on req.locals so page server load functions can read it
	req.locals = { ...req.locals, enterpriseMode: true };
	next();
};
