#!/usr/bin/env node

/**
 * Simple script to generate secure random secrets for your .env file
 * Run this with: node generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

console.log('\n🔐 Generated Secure Secrets for Your .env File');
console.log('='.repeat(60));

console.log('\n📋 Copy these values to your .env file:');
console.log('-'.repeat(40));

console.log(`JWT_SECRET=${generateSecret(32)}`);
console.log(`NEXTAUTH_SECRET=${generateSecret(32)}`);
console.log(`SESSION_SECRET=${generateSecret(24)}`);
console.log(`ENCRYPTION_KEY=${generateSecret(16)}`);

console.log('\n✅ What these secrets do:');
console.log('• JWT_SECRET: Secures user login tokens');
console.log('• NEXTAUTH_SECRET: NextAuth.js session encryption');
console.log('• SESSION_SECRET: General session security');
console.log('• ENCRYPTION_KEY: Encrypts sensitive data');

console.log('\n⚠️  IMPORTANT:');
console.log('• Keep these secrets private (never share them)');
console.log('• Use different secrets for development vs production');
console.log('• Store them safely - losing them means users need to re-login');

console.log('\n🎯 Next Steps:');
console.log('1. Copy the values above to your .env file');
console.log('2. Set up your Supabase database');
console.log('3. Your app will be ready to run!');

console.log('\n');