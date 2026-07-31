import { useQuery } from '@tanstack/react-query'
import { getAnalyticsFeatures, getAnalyticsSummary } from '../services/analyticsService.js'

export function useAnalytics(filters = {}) {
  return useQuery({
    queryKey: ['analytics-features', filters],
    queryFn: () => getAnalyticsFeatures(filters),
  })
}

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => getAnalyticsSummary(),
  })
}

export default useAnalytics
