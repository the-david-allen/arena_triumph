import { Card, CardContent } from "@/components/ui/card";

export function MainLandingPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome to the Arena. Can you triumph?
            </h1>
            
            <div className="space-y-3 text-lg text-muted-foreground max-w-3xl mx-auto">
              <p>
                You'll need to master a number of challenges to have a chance at beating some of the Arena bosses.
              </p>
              
              <p>
                Obtain Gear for your armor and weapon slots by beating that slot's challenge - the better you do, the better gear you'll receive.
              </p>
              
              <p>
                Manage your Inventory by equipping or removing gear.
              </p>
              
              <p>
                When you're ready, Battle to test your strength against today's Arena bosses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Battle</h2>
              <p className="text-muted-foreground">
                Test your strength against today's Arena bosses
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Obtain Gear</h2>
              <p className="text-muted-foreground">
                Master challenges to earn powerful equipment
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Manage Inventory</h2>
              <p className="text-muted-foreground">
                Equip your best gear for battle
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
