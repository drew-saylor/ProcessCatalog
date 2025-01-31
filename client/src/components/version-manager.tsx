import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { type SelectVersion, type InsertVersion } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GitCommit, Box } from "lucide-react";

interface VersionManagerProps {
  processId: number;
  versions: SelectVersion[];
  onVersionSelect: (version: SelectVersion) => void;
}

export function VersionManager({ processId, versions, onVersionSelect }: VersionManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const form = useForm<InsertVersion>();

  const createVersionMutation = useMutation({
    mutationFn: async (data: InsertVersion) => {
      const res = await apiRequest("POST", `/api/processes/${processId}/versions`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: [`/api/processes/${processId}`] });
      toast({ title: "Version created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create version",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Versions</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? "Cancel" : "New Version"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isCreating ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                createVersionMutation.mutate({ ...data, processId })
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Tag</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="v1.0.0" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commitHash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commit Hash</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="git commit hash" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createVersionMutation.isPending}
              >
                Create Version
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-2">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No versions available
              </p>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                  onClick={() => onVersionSelect(version)}
                >
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" />
                    <span className="font-medium">{version.version}</span>
                    <span className="text-sm text-muted-foreground">
                      ({version.commitHash.slice(0, 7)})
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Box className="h-4 w-4 mr-2" />
                    Deploy
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
