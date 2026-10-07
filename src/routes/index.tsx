import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HomePage } from './HomePage'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  search: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional().catch('newest'),
  minPrice: z.number().optional().catch(0.02),
  maxPrice: z.number().optional().catch(12.3),
  network: z.enum(['Ethereum', 'Polygon', 'Solana']).optional(),
})

export const Route = createFileRoute('/')({
  component: Index,
  validateSearch: (search) => searchSchema.parse(search),
})

function Index() {
  return <HomePage searchParams={Route.useSearch()} />
}
