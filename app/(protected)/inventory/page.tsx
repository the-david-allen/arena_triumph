import { Card } from '@/components/ui/Card'

export const runtime = 'edge'

export default function InventoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Manage Inventory
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all your collected items, equipment, and resources. Organize your
          inventory to optimize your battle readiness.
        </p>
        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Inventory management coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
