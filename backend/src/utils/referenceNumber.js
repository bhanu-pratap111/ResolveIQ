const crypto = require('crypto');

function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `CMP-${year}-${random}`;
}

module.exports = { generateReferenceNumber };
