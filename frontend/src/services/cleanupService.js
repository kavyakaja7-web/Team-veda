import api from './api.js'

export async function getCleanups(params = {}) {
  const { data } = await api.get('/api/cleanups', { params })
  return data
}
