const buckets = new Map();

export default function rateLimitMobileScan(req, res, next) {
    const limit = Number(process.env.MOBILE_SCAN_RATE_LIMIT || 60);
    const windowMs = Number(process.env.MOBILE_SCAN_RATE_WINDOW_MS || 60000);

    const key = req.user?.userId || req.ip || 'anon';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > limit) {
        return res.status(429).json({
            success: false,
            error: 'Too many scan requests. Please try again later.',
        });
    }

    next();
}