#!/usr/bin/env node
/**
 * scripts/generate-jwt-secret.js
 * ==============================
 * Generates a cryptographically strong 64-character (48-byte) base64 JWT secret
 * suitable for production deployment in Render, Railway, or local .env.
 *
 * Usage:
 *   node scripts/generate-jwt-secret.js
 *   npm run generate-secret
 */

import crypto from 'crypto';

const secret = crypto.randomBytes(48).toString('base64');

console.log('\n===========================================================');
console.log('🔑 Generated Cryptographically Secure JWT_SECRET:');
console.log('===========================================================');
console.log(`\n${secret}\n`);
console.log('===========================================================');
console.log('📋 Deployment Instructions:');
console.log('  1. For Local Development: Add this to your root `.env` file:');
console.log(`     JWT_SECRET="${secret}"`);
console.log('  2. For Production (Render / Railway / etc.):');
console.log('     Add `JWT_SECRET` as an environment variable in your dashboard.');
console.log('===========================================================\n');
