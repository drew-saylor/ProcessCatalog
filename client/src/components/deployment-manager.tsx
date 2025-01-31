import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { type SelectDeployment, type InsertDeployment } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Box, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DeploymentManagerProps {
  versionId?: number;
}

export function DeploymentManager({ versionId }: DeploymentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeployment, setSelectedDeployment] = useState<SelectDeployment | null>(null);
  const [input, setInput] = useState("");

  const { data: deployments = [] } = useQuery<SelectDeployment[]>({
    queryKey: ["/api/deployments"],
    enabled: true,
  });

  const form = useForm<InsertDeployment>();

  const createDeploymentMutation = useMutation({
    mutationFn: async (data: InsertDeployment) => {
      const res = await apiRequest("POST", `/api/versions/${versionId}/deploy`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deployments"] });
      toast({ title: "Deployment created successfully" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ deploymentId, input }: { deploymentId: number; input: string }) => {
      const res = await apiRequest("POST", `/api/deployments/${deploymentId}/execute`, { input });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Process executed successfully" });
    },
  });

  if (!versionId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Select a version to manage deployments
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Deployments</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Box className="h-4 w-4 mr-2" />
                New Deployment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deployment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) =>
                    createDeploymentMutation.mutate({ ...data, versionId })
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createDeploymentMutation.isPending}
                  >
                    Create Deployment
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments.length === 0 ? (
            <p className="text-center text-muted-foreground">No deployments available</p>
          ) : (
            deployments.map((deployment) => (
              <Card key={deployment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium">{deployment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {deployment.status}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDeployment(deployment)}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Execute
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Execute Deployment: {deployment.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Enter input data..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                          />
                          <Button
                            className="w-full"
                            onClick={() =>
                              executeMutation.mutate({
                                deploymentId: deployment.id,
                                input,
                              })
                            }
                            disabled={executeMutation.isPending}
                          >
                            Execute
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
