// Helmet security headers — CSP disabled for JSON API (SPA sets its own CSP).

import helmet from "helmet";
import { env } from "../config/env";

export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
});
