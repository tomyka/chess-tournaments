"use client";

import { Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "grid" | "calendar";
  onViewChange: (view: "grid" | "calendar") => void;
}

export function ViewToggle({ view }: ViewToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-9 px-3"
      disabled
    >
      <Grid3x3 className="h-4 w-4" />
      Grid
    </Button>
  );
}
