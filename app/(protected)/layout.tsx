import { NavigationBar } from "@/components/NavigationBar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication is handled by middleware for Edge Runtime compatibility
  // requireAuth() was removed because it uses cookies() from next/headers
  // which is not available in Edge Runtime

  return (
    <div className="min-h-screen bg-bg">
      <NavigationBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
