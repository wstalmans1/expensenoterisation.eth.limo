export const expenseRegistryAbi = [
  {
    type: 'event',
    name: 'ExpenseAdded',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'index', type: 'uint256' },
      { indexed: false, name: 'date', type: 'uint64' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
    ],
    anonymous: false,
  },
  {
    type: 'function',
    name: 'addExpense',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'date', type: 'uint64' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getExpenses',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        name: 'expenses',
        type: 'tuple[]',
        components: [
          { name: 'date', type: 'uint64' },
          { name: 'amount', type: 'uint256' },
          { name: 'description', type: 'string' },
        ],
      },
    ],
  },
] as const
