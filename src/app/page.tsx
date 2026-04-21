import Link from "next/link";
import { Crown, ArrowRight, Zap, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Trophy,
    title: "FIDE Registered",
    description: "All tournaments are officially registered with the International Chess Federation.",
  },
  {
    icon: Clock,
    title: "Live Updates",
    description: "Tournament data is regularly refreshed from chess-results.com.",
  },
  {
    icon: Zap,
    title: "All Time Controls",
    description: "Browse Standard, Rapid, and Blitz tournaments across Lithuania.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">
                Lithuanian Chess Tournament Hub
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Chess Tournaments
              <span className="block text-amber-600 dark:text-amber-400">
                in Lithuania
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Discover upcoming and recent FIDE-registered chess tournaments
              across Lithuania. Filter by time control, status, and location.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/tournaments">
                <Button size="lg" className="gap-2">
                  Browse Tournaments
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a
                href="https://chess-results.com/fed.aspx?lan=1&fed=LTU"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  chess-results.com
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Decorative chess pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm bg-muted/30">
              <CardContent className="pt-6">
                <feature.icon className="mb-4 h-8 w-8 text-amber-500" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
