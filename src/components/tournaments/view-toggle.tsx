"use client";

import { Grid3x3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "grid" | "calendar";
  onViewChange: (view: "grid" | "calendar") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2 border rounded-lg p-1 bg-muted/30 w-fit">
      <Button
        variant={view === "grid" ? "default" : "ghost"}
        size="sm"
        className="gap-2"
        onClick={() => onViewChange("grid")}
      >
        <Grid3x3 className="h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={view === "calendar" ? "default" : "ghost"}
        size="sm"
        className="gap-2"
        onClick={() => onViewChange("calendar")}
      >
        <Calendar className="h-4 w-4" />
        Calendar
      </Button>
    </div>
  );
}
