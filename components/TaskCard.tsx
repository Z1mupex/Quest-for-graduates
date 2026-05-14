import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  active?: boolean;
};

export function TaskCard({
  title,
  description,
  children,
  active,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        "mx-auto w-full max-w-md shadow-glow",
        active && "shadow-glow",
      )}
    >
      <CardHeader className="space-y-2 p-8">
        <CardTitle className="font-display text-xl leading-snug">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 p-8 pt-0">{children}</CardContent>
    </Card>
  );
}
