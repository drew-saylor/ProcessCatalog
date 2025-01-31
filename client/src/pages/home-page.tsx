import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ProcessList } from "@/components/process-list";
import { ProcessForm } from "@/components/process-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogOut } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Process Catalog</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Processes</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Process
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Process</DialogTitle>
              </DialogHeader>
              <ProcessForm
                onSuccess={() => {
                  setDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <ProcessList />
      </main>
    </div>
  );
}
