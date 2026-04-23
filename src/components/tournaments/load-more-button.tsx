"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreButton({
  onClick,
  isLoading,
  hasMore,
}: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={onClick}
        disabled={isLoading}
        size="lg"
        variant="outline"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            Load More Tournaments
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
