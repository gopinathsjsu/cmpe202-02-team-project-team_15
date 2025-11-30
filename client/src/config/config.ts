// Use relative path for CloudFront + ALB setup
// This will work with both CloudFront (production) and local development with proxy
export const BACKEND_BASE_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || "";
