import { useQuery } from '@tanstack/react-query'
import { getCleanups } from '../services/cleanupService.js'

export default function useCleanups(filters = {}) {
  return useQuery({
    queryKey: ['cleanups', filters],
    queryFn: () => getCleanups(filters),
  })
}
