export const EXPENSE_REGISTRY_ADDRESS =
  (import.meta.env.VITE_EXPENSE_REGISTRY_ADDRESS as `0x${string}` | undefined) ||
  undefined

export const EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS =
  (import.meta.env
    .VITE_EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS as `0x${string}` | undefined) ||
  undefined

if (!EXPENSE_REGISTRY_ADDRESS) {
  console.warn(
    'VITE_EXPENSE_REGISTRY_ADDRESS is not set. Add it to apps/frontend/.env.local after deployment.'
  )
}

if (!EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS) {
  console.warn(
    'VITE_EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS is not set. Add it to apps/frontend/.env.local after deployment.'
  )
}
