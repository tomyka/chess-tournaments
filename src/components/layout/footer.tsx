import { Crown } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="h-4 w-4 text-amber-500" />
            <span>Chess Tournaments LT</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Data sourced from{" "}
            <a
              href="https://chess-results.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              chess-results.com
            </a>
            {" · "}
            FIDE registered tournaments in Lithuania
          </p>
        </div>
      </div>
    </footer>
  );
}
