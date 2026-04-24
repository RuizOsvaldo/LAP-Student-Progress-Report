import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export function verifySlackSignature(req: Request, res: Response, next: NextFunction): void {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    // Allow through in dev without a signing secret, but warn loudly.
    console.warn('[slack] SLACK_SIGNING_SECRET not set — skipping signature verification (dev only)');
    next();
    return;
  }

  const timestamp = req.headers['x-slack-request-timestamp'] as string | undefined;
  const slackSig = req.headers['x-slack-signature'] as string | undefined;

  if (!timestamp || !slackSig) {
    res.status(400).json({ error: 'Missing Slack signature headers' });
    return;
  }

  // Reject requests older than 5 minutes to prevent replay attacks.
  const ageSecs = Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10));
  if (ageSecs > 300) {
    res.status(400).json({ error: 'Request timestamp too old' });
    return;
  }

  if (!req.rawBody) {
    res.status(500).json({ error: 'Raw body unavailable for signature check' });
    return;
  }

  const sigBase = `v0:${timestamp}:${req.rawBody.toString()}`;
  const expected = 'v0=' + createHmac('sha256', signingSecret).update(sigBase).digest('hex');

  // Use timing-safe comparison to prevent timing attacks.
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(slackSig, 'utf8');
  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    res.status(403).json({ error: 'Invalid Slack signature' });
    return;
  }

  next();
}
