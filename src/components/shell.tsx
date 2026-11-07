"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Dumbbell, Grid2X2, UserRound, X } from "lucide-react";
import { ProgressProvider, useProgress } from "@/hooks/use-progress";
import { AppearanceProvider } from "@/hooks/use-appearance";
import { ThemeToggle } from "./appearance";
import { Backwaters } from "./kerala-motifs";
// Four destinations. Lesson and practice screens highlight their parent tab.
const nav = [
  { href: "/", name: "Learn", icon: BookOpen, also: ["/learn"] },
  {
    href: "/practice",
    name: "Practice",
    icon: Dumbbell,
    also: ["/flashcards", "/test"],
  },
  { href: "/reference", name: "Alphabet", icon: Grid2X2, also: [] },
  { href: "/settings", name: "Me", icon: UserRound, also: [] },
];
const strip = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);
const isActive = (path: string, n: (typeof nav)[number]) =>
  strip(path) === n.href || n.also.includes(strip(path));
function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { progress, error, dismissError } = useProgress();
  const total = progress.introduced.length;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon" lang="ml">
            അ
          </span>
          <span>
            Aksharam
            <span className="brand-sub" lang="ml">
              അക്ഷരം
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${isActive(path, n) ? "active" : ""}`}
              aria-current={isActive(path, n) ? "page" : undefined}
            >
              <n.icon size={19} />
              {n.name}
              {isActive(path, n) && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Backwaters className="sidebar-backwaters" />
          <ThemeToggle />
          <p className="sidebar-progress">{total} letters learned</p>
        </div>
      </aside>
      <div className="content-shell">
        <div className="mobile-header">
          <Link href="/" className="mobile-brand">
            Aksharam <span lang="ml">അക്ഷരം</span>
          </Link>
          <ThemeToggle />
        </div>
        <main id="main">
          {error && (
            <div className="notice" role="alert">
              {error}
              <button aria-label="Dismiss message" onClick={dismissError}>
                <X size={17} />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-label={n.name}
            aria-current={isActive(path, n) ? "page" : undefined}
            className={isActive(path, n) ? "active" : ""}
          >
            <n.icon size={20} />
            <span>{n.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <ProgressProvider>
        <Layout>{children}</Layout>
      </ProgressProvider>
    </AppearanceProvider>
  );
}
