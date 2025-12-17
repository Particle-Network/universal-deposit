const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 4000;

// Load private key once at startup
const privateKeyPath = path.join(__dirname, 'private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// JWKS endpoint for Particle dashboard
app.get('/.well-known/jwks.json', (_req, res) => {
  const jwksPath = path.join(__dirname, '.well-known', 'jwks.json');
  const jwks = fs.readFileSync(jwksPath, 'utf8');
  res.setHeader('Content-Type', 'application/json');
  res.send(jwks);
});

// JWT issuance endpoint for the frontend
app.get('/api/particle-jwt', (req, res) => {
  const uidRaw = (req.query.uid || 'demo-user').toString().trim();

  // IMPORTANT: avoid a raw 0x... UID; prefix it so it can't be interpreted as a wallet address
  const uid = `ua:${uidRaw.toLowerCase()}`;

  const token = jwt.sign(
    { sub: uid },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: '10m',
      keyid: 'main-key-1',
    }
  );

  res.json({ jwt: token, sub: uid });
});

app.listen(PORT, () => {
  console.log(`Auth/JWKS server running on http://localhost:${PORT}`);
});
