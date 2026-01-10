import { Card } from '@/components/ui/Card'

export default function ObtainGearPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Obtain Gear</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse the marketplace and shop to acquire new equipment, weapons, and items to enhance
          your combat capabilities.
        </p>
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            Gear marketplace coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
