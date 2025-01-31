import { useQuery } from "@tanstack/react-query";
import { ProcessCard } from "./process-card";
import { type SelectProcess } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function ProcessList() {
  const { data: processes, isLoading } = useQuery<SelectProcess[]>({
    queryKey: ["/api/processes"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    );
  }

  if (!processes?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No processes found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {processes.map((process) => (
        <ProcessCard key={process.id} process={process} />
      ))}
    </div>
  );
}
