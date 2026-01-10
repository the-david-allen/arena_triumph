import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { redirect } from 'next/navigation'

export default async function MainPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Welcome to Arena Triumph
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ready to battle? Choose an option from the navigation bar to get started.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Battle</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Enter the arena and fight for glory
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Obtain Gear</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Acquire new equipment and weapons
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
              Manage Inventory
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Organize and manage your items
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Inspect</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              View detailed information about items
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Settings</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Configure your game preferences
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
