import { useQuery } from '@tanstack/react-query'
import { getAnalyticsFeatures } from '../services/analyticsService.js'
import { getPredictions } from '../services/predictionService.js'

export function useAnalytics(filters = {}) {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: () => getAnalyticsFeatures(filters),
  })
}

export function usePredictions(filters = {}) {
  return useQuery({
    queryKey: ['predictions', filters],
    queryFn: () => getPredictions(filters),
  })
}

export default useAnalytics
