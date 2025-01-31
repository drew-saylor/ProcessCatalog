import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type SelectProcess } from "@db/schema";
import { Link } from "wouter";
import { GitBranch, PlayCircle } from "lucide-react";

export function ProcessCard({ process }: { process: SelectProcess }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{process.name}</CardTitle>
          <Badge variant={process.type === "llm" ? "default" : "secondary"}>
            {process.type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{process.description}</p>
        <div className="flex items-center text-sm text-muted-foreground">
          <GitBranch className="h-4 w-4 mr-2" />
          <a href={process.repositoryUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Repository
          </a>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/process/${process.id}`}>View Details</Link>
        </Button>
        <Button>
          <PlayCircle className="h-4 w-4 mr-2" />
          Execute
        </Button>
      </CardFooter>
    </Card>
  );
}
