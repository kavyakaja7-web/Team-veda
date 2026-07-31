import api from './api.js'

const MOCK_FEATURES = {
  available: false,
  generatedAt: null,
  wardScores: [
    { ward: 'Ward 1', score: 62 },
    { ward: 'Ward 2', score: 41 },
    { ward: 'Ward 3', score: 78 },
    { ward: 'Ward 4', score: 55 },
    { ward: 'Ward 5', score: 33 },
  ],
  note: 'Placeholder data — connect GET /api/analytics/features to replace this.',
}

export async function getAnalyticsFeatures(params = {}) {
  try {
    const { data } = await api.get('/api/analytics/features', { params })
    return { ...data, available: true }
  } catch (err) {
    return MOCK_FEATURES
  }
}
