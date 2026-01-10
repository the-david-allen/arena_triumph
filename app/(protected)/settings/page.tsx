import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage your account settings and game preferences.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Info</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Email: {user?.email || 'Not available'}
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Game Preferences
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Game settings and preferences coming soon...
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
