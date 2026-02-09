import { QueryClient } from '@tanstack/react-query'

export function invalidateExpenses(qc: QueryClient) {
  qc.invalidateQueries()
}
