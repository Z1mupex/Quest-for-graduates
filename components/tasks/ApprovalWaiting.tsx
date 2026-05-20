"use client";

import { Card, CardContent } from "@/components/ui/card";

export function ApprovalWaiting() {
  return (
    <Card className="border-accent/30">
      <CardContent className="p-6 text-center text-muted-foreground">
        Ожидайте подтверждения организатора
      </CardContent>
    </Card>
  );
}
