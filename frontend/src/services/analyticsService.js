import api from './api.js'

export async function getAnalyticsFeatures(params = {}) {
  const { data } = await api.get('/api/analytics/features', { params })
  return data
}

export async function getAnalyticsSummary() {
  const { data } = await api.get('/api/analytics/summary')
  return data
}
