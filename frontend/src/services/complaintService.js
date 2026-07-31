import api from './api.js'

export async function getComplaints(params = {}) {
  const { data } = await api.get('/api/complaints', { params })
  return data
}
