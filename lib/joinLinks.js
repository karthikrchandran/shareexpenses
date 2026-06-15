const JOIN_TOKEN_PATTERN = /^[a-f0-9-]{36}$/i;
const { randomUUID } = require('node:crypto');

function createJoinToken(randomUUID = defaultRandomUUID) {
  return randomUUID();
}

function validateJoinToken(token) {
  if (typeof token !== 'string' || !JOIN_TOKEN_PATTERN.test(token)) {
    throw new Error('Invalid join link');
  }

  return token;
}

function buildJoinUrl({ appUrl, token }) {
  const cleanAppUrl = String(appUrl || '').replace(/\/$/, '');
  return `${cleanAppUrl}/join/${validateJoinToken(token)}`;
}

function defaultRandomUUID() {
  return randomUUID();
}

module.exports = {
  buildJoinUrl,
  createJoinToken,
  validateJoinToken,
};
