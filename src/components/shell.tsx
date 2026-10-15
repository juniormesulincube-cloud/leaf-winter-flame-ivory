import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/cn";
import { THEMES, themeById, useTheme } from "@/lib/theme";

const NAV = [
  { to: "/", hash: "how", label: "How it works" },
  { to: "/privacy", hash: undefined, label: "Privacy" },
  { to: "/help", hash: undefined, label: "Help" },
] as const;

function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 rounded-lg">
      <span className="block h-10 w-8">
        <Mascot decorative className="h-full w-full" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-fg">
        File<span className="text-accent-ink">Ember</span>
      </span>
    </Link>
  );
}

export function Shell({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "narrow";
}) {
  const { theme, mode, setTheme, toggleMode } = useTheme();
  const current = themeById(theme);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
        <Wordmark />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <nav className="flex items-center" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-sm text-muted hover:text-fg"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <span className="pr-1 text-sm text-muted">
              Colour: <span className="text-fg">{current.label}</span>
            </span>
            <div className="flex items-center" role="group" aria-label="Colour theme">
              {THEMES.map((item) => {
                const selected = item.id === theme;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Use ${item.label} colours`}
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 ease-out active:not-disabled:scale-[0.96]",
                      selected && "ring-2 ring-fg ring-offset-2 ring-offset-bg",
                    )}
                  >
                    <span className={cn("h-5 w-5 rounded-full ring-1 ring-fg/20", item.swatch)} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={toggleMode}
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-11 w-11 items-center justify-center rounded-full text-fg transition-transform duration-150 ease-out hover:bg-card active:not-disabled:scale-[0.96]"
            >
              {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
        </div>
      </header>
      <main
        id="content"
        className={cn(
          "mx-auto w-full flex-1 px-4 pb-16 sm:px-6",
          width === "wide" ? "max-w-6xl" : "max-w-lg",
        )}
      >
        {children}
      </main>
      <footer className="mt-auto border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <Wordmark />
          <nav className="flex flex-wrap items-center" aria-label="Footer">
            <Link to="/" hash="how" className="inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg">
              How it works
            </Link>
            <Link to="/privacy" className="inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg">
              Privacy
            </Link>
            <Link to="/help" className="inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg">
              Help
            </Link>
            <Link to="/about" className="inline-flex min-h-11 items-center px-2.5 text-sm text-muted hover:text-fg">
              About FileEmber
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function Prose({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <Shell>
      <article className="mx-auto max-w-3xl pt-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted">{lede}</p>
        <div className="mt-10 space-y-10 text-base leading-relaxed text-fg">{children}</div>
      </article>
    </Shell>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-fg">{title}</h2>
      <div className="space-y-3 text-muted">{children}</div>
    </section>
  );
}
