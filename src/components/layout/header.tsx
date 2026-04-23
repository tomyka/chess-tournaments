import Link from "next/link";
import { Crown } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm">
            <Crown className="h-5 w-5 text-amber-500" />
            <span>Chess Tournaments</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
