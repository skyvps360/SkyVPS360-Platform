import { Request, Response, NextFunction } from 'express';

/**
 * Apply security headers including Content-Security-Policy
 */
export function setupSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Set Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' *;"
  );

  // Add other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Continue to next middleware
  next();
}

/**
 * Serve inline favicon for requests to /favicon.ico to prevent 404s
 */
export function inlineFaviconHandler(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/favicon.ico') {
    // Create a simple favicon data URI
    const faviconData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAR5JREFUeNpiYBgF+ICRUMCyqCMXiP+TgJcB8QQgZoUZ8J9YDfh/AwgYmUDmA3E7kM0GFQRqxAsYoQbMB+L/uAzA5pVGoLdBBq0H4jSQGDafYDPgPxBvgBreSsiQWUAcC1MBdwFmGMC88B/NVevRDa8BYgGoQehqogkZsAeIcyjiuHwAM8wRiJ9hM+Q/LgcxYTGAE4iTsDkCn2FMWAzQA+J0XBphM4AJixdA4ZOOMFSCCMPw5YELaFE2HpQUkWnABqgLNkElQRoxXUbQAKghG4HYBCpUjM1lBAyohtpgBBXqwOYyXAaAUl0KWi5IgzIOToPQsrE31AYdqFA1erRj1YeWkULQnJgLFeqAmgOzqRObASxALAnEUUC8GYhFscoCBBgArZ5CuRL4PjIAAAAASUVORK5CYII=',
      'base64'
    );

    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Content-Length', faviconData.length);
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // Cache for 30 days
    res.end(faviconData);
  } else {
    next();
  }
}
