// scripts/generate-keys.mjs
import { generateKeyPairSync } from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as jose from 'jose'; // works on any jose version

// 1. Generate RSA keypair (2048 bits, RS256)
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// 2. Export public key to JWK
const publicJwk = await jose.exportJWK(publicKey);
publicJwk.use = 'sig';
publicJwk.alg = 'RS256';
publicJwk.kid = 'main-key-1';

// 3. Prepare JWKS object
const jwks = { keys: [publicJwk] };

// 4. Prepare directories
const serverDir = path.join(process.cwd(), 'server');
const jwksDir = path.join(serverDir, '.well-known');

await fs.mkdir(jwksDir, { recursive: true });

// 5. Write JWKS file
await fs.writeFile(
  path.join(jwksDir, 'jwks.json'),
  JSON.stringify(jwks, null, 2),
  'utf8'
);

// 6. Export private key PEM
const privatePem = privateKey.export({
  type: 'pkcs8',
  format: 'pem',
});

await fs.writeFile(path.join(serverDir, 'private.pem'), privatePem, 'utf8');

console.log('Created:');
console.log(' - server/private.pem');
console.log(' - server/.well-known/jwks.json');
