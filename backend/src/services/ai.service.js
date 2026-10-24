const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function classifyComplaint(title, description) {
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/classify`, { title, description }, { timeout: 5000 });
    return res.data;
  } catch (err) {
    console.warn('[AI Service] classify unavailable:', err.message);
    return null;
  }
}

async function findRelatedCases(query, candidates) {
  try {
    const res = await axios.post(
      `${AI_SERVICE_URL}/find-related-full`,
      { query, candidates },
      { timeout: 10000 }
    );
    return res.data;
  } catch (err) {
    console.warn('[AI Service] find-related unavailable:', err.message);
    return { related_cases: [], model_version: 'unavailable' };
  }
}

module.exports = { classifyComplaint, findRelatedCases };
