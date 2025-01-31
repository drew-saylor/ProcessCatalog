import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { type SelectProcess, type SelectVersion } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VersionManager } from "@/components/version-manager";
import { DeploymentManager } from "@/components/deployment-manager";
import { GitBranch, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ProcessDetail() {
  const [, params] = useRoute("/process/:id");
  const [selectedVersion, setSelectedVersion] = useState<SelectVersion | null>(null);

  const { data: process } = useQuery<SelectProcess & { versions: SelectVersion[] }>({
    queryKey: [`/api/processes/${params?.id}`],
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

        <div className="grid gap-8">
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

          <div className="grid md:grid-cols-2 gap-8">
            <VersionManager
              processId={process.id}
              versions={process.versions || []}
              onVersionSelect={setSelectedVersion}
            />
            <DeploymentManager versionId={selectedVersion?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}