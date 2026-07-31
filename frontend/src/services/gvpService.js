import api from './api.js'

export async function getGVPs(params = {}) {
  const { data } = await api.get('/api/gvps', { params })
  return data
}

export async function getGVPById(id) {
  const { data } = await api.get(`/api/gvps/${id}`)
  return data
}

export async function getGVPsNear({ lat, lon, lng, radius_m, radius }) {
  const { data } = await api.get('/api/gvps/near', {
    params: {
      lat,
      lon: lon ?? lng,
      radius_m: radius_m ?? radius ?? 1000,
    },
  })
  return data
}
