import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type SelectProcess } from "@db/schema";
import { Link } from "wouter";
import { GitBranch, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { ProcessForm } from "./process-form";

export function ProcessCard({ process }: { process: SelectProcess }) {
  const [isOpen, setIsOpen] = useState(false);

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Box className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deploy Process</DialogTitle>
            </DialogHeader>
            <ProcessForm processId={process.id} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}