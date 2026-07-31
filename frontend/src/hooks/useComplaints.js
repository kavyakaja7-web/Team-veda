import { useQuery } from '@tanstack/react-query'
import { getComplaints } from '../services/complaintService.js'

export default function useComplaints(filters = {}) {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: () => getComplaints(filters),
  })
}
