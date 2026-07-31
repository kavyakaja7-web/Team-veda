import api from './api.js'

const MOCK_PREDICTIONS = {
  available: false,
  modelVersion: null,
  predictions: [],
  note: 'ML model coming soon — connect GET /api/predictions to replace this.',
}

export async function getPredictions(params = {}) {
  try {
    const { data } = await api.get('/api/predictions', { params })
    return { ...data, available: true }
  } catch (err) {
    return MOCK_PREDICTIONS
  }
}
