import { useQuery } from '@tanstack/react-query'
import { getGVPs } from '../services/gvpService.js'

export default function useGVPs(filters = {}) {
  return useQuery({
    queryKey: ['gvps', filters],
    queryFn: () => getGVPs(filters),
  })
}
