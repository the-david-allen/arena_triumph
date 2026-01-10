import { Card } from '@/components/ui/Card'

export default function InspectPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Inspect</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Examine items, equipment, and characters in detail. View statistics, properties, and
          special abilities of your gear.
        </p>
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Item inspection coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
