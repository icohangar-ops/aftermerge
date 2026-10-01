"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRuns } from "@/lib/runs-context";

const NAV = [
  { href: "/", label: "Board" },
  { href: "/demo", label: "3-min demo" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const demo = pathname.startsWith("/demo");

  if (demo) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b121b]/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md border border-cyan-400/40 bg-cyan-400/10 text-cyan-200">
              <GitMerge className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-[0.18em] text-cyan-100">
                AFTERMERGE
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Post-merge agent
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:ml-4">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <p className="hidden text-right text-[11px] leading-snug text-muted-foreground sm:block">
              Northline Mechanical
              <span className="block text-foreground/80">FieldClear · simulated GitLab</span>
            </p>
            <SimulateButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[11px] text-muted-foreground sm:px-6">
          <p>Cubiczan · Sam Desigan · sam@cubiczan.com</p>
          <p>Life After Code demo · Path A · no GitLab token</p>
        </div>
      </footer>
    </div>
  );
}

export function SimulateButton({
  label = "Simulate merge",
}: {
  label?: string;
}) {
  const { runs, simulateMerge } = useRuns();
  const router = useRouter();
  const inflight = runs.find((run) => run.live && run.status === "running");

  if (inflight) {
    return (
      <Button
        size="lg"
        variant="secondary"
        onClick={() => router.push(`/runs/${inflight.id}`)}
      >
        Watch {inflight.id}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={() => {
        const id = simulateMerge();
        router.push(`/runs/${id}`);
      }}
    >
      <GitMerge />
      {label}
    </Button>
  );
}
