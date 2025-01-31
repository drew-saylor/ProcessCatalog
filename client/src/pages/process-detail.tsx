import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type SelectProcess, type SelectExecution } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GitBranch, ArrowLeft, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ProcessDetail() {
  const [, params] = useRoute("/process/:id");
  const { toast } = useToast();
  const [input, setInput] = useState("");

  const { data: process } = useQuery<SelectProcess>({
    queryKey: [`/api/processes/${params?.id}`],
  });

  const executeMutation = useMutation({
    mutationFn: async (input: string) => {
      const res = await apiRequest("POST", `/api/processes/${params?.id}/execute`, { input });
      return res.json();
    },
    onSuccess: (execution: SelectExecution) => {
      toast({
        title: "Process executed successfully",
        description: `Status: ${execution.status}`,
      });
    },
  });

  if (!process) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Link>
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-bold">{process.name}</CardTitle>
                <Badge variant={process.type === "llm" ? "default" : "secondary"}>
                  {process.type.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{process.description}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4 mr-2" />
                <a
                  href={process.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Repository
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execute Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter input data..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={() => executeMutation.mutate(input)}
                  disabled={executeMutation.isPending}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
