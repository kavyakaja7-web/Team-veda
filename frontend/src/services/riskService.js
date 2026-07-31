import api from './api.js'

export async function getHighRiskGvps(params = {}) {
  const { data } = await api.get('/api/risk/high-risk', { params })
  return data
}
