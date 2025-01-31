import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { type SelectDeployment, type InsertDeployment } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Box, PlayCircle, Upload, Database } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeploymentManagerProps {
  versionId?: number;
}

type ExecuteData = {
  inputType: "direct" | "file" | "bigquery";
  inputSource: string;
  inputMetadata?: Record<string, any>;
};

export function DeploymentManager({ versionId }: DeploymentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeployment, setSelectedDeployment] = useState<SelectDeployment | null>(null);
  const [inputType, setInputType] = useState<"direct" | "file" | "bigquery">("direct");

  const { data: deployments = [] } = useQuery<SelectDeployment[]>({
    queryKey: [`/api/versions/${versionId}/deployments`],
    enabled: !!versionId,
  });

  const form = useForm<InsertDeployment>();
  const executeForm = useForm<ExecuteData>();

  const createDeploymentMutation = useMutation({
    mutationFn: async (data: InsertDeployment) => {
      const res = await apiRequest("POST", `/api/versions/${versionId}/deploy`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/versions/${versionId}/deployments`] });
      toast({ title: "Deployment created successfully" });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async ({ deploymentId, data }: { deploymentId: number; data: ExecuteData }) => {
      const formData = new FormData();
      formData.append("inputType", data.inputType);
      formData.append("inputSource", data.inputSource);

      if (data.inputType === "file" && data.inputMetadata?.file) {
        formData.append("file", data.inputMetadata.file);
      }

      if (data.inputMetadata) {
        formData.append("inputMetadata", JSON.stringify(data.inputMetadata));
      }

      const res = await fetch(`/api/deployments/${deploymentId}/execute`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

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
                        <Form {...executeForm}>
                          <form
                            onSubmit={executeForm.handleSubmit((data) =>
                              executeMutation.mutate({
                                deploymentId: deployment.id,
                                data,
                              })
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={executeForm.control}
                              name="inputType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Input Type</FormLabel>
                                  <Select
                                    onValueChange={(value: "direct" | "file" | "bigquery") => {
                                      field.onChange(value);
                                      setInputType(value);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select input type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="direct">Direct Input</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                      <SelectItem value="bigquery">BigQuery Table</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />

                            {inputType === "direct" && (
                              <FormField
                                control={executeForm.control}
                                name="inputSource"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Input Data (JSON)</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder='{"key": "value"}'
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}

                            {inputType === "file" && (
                              <FormField
                                control={executeForm.control}
                                name="inputSource"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Upload File</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="file"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            field.onChange(file.name);
                                            executeForm.setValue("inputMetadata", {
                                              file,
                                              type: file.type,
                                            });
                                          }
                                        }}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}

                            {inputType === "bigquery" && (
                              <FormField
                                control={executeForm.control}
                                name="inputSource"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>BigQuery Table</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="project.dataset.table"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}

                            <Button
                              type="submit"
                              className="w-full"
                              disabled={executeMutation.isPending}
                            >
                              Execute
                            </Button>
                          </form>
                        </Form>
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