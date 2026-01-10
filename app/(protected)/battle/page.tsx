import { Card } from '@/components/ui/Card'

export const runtime = 'edge'

export default function BattlePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Battle</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Prepare to enter the arena and face your opponents. This page will contain the battle
          interface where you can engage in combat.
        </p>
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">
            Battle functionality coming soon...
          </p>
        </div>
      </Card>
    </div>
  )
}
