"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Dumbbell, Grid2X2, UserRound, X } from "lucide-react";
import { ProgressProvider, useProgress } from "@/hooks/use-progress";
import { AppearanceProvider } from "@/hooks/use-appearance";
import { ThemeToggle } from "./appearance";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { motionAllowed, ease } from "./motion";
import { Bloom } from "./bloom";
import { StudyPet } from "./study-pet";
import { publicAssetPath } from "@/lib/paths";
import { SidebarResize } from "./sidebar-resize";
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
  const { ready, progress, error, dismissError } = useProgress();
  const total = progress.introduced.length;
  const main = useRef<HTMLElement>(null);
  const departure = useRef<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (window.scrollY > 0) window.scrollTo(0, 0);
    const element = main.current?.firstElementChild as HTMLElement | null, from = departure.current;
    departure.current = null;
    if (!element || element.getAttribute("role") === "dialog" || !from || !motionAllowed() || !element.animate) return;
    const to = element.getBoundingClientRect();
    const animation = element.animate([
      { opacity: .35, transformOrigin: "50% 15%", transform: `translateY(${Math.max(-45, Math.min(45, from.top - to.top))}px) scale(.96)` },
      { opacity: 1, transformOrigin: "50% 15%", transform: "none" },
    ], { duration: 480, easing: ease });
    return () => animation.cancel();
  }, [path]);
  // The server cannot know whether saved progress or #intro will open the
  // landing. Hold the entire home shell until that decision is available,
  // rather than painting navigation underneath a page-level loading message.
  if (!ready && strip(path) === "/") return <main
    style={{ position: "fixed", inset: 0, background: "#1a1a1a" }}
  ><span role="status" aria-label="Loading Aksharam" /></main>;
  return (
    <div className="app-shell" onClickCapture={event => {
      const link = (event.target as Element).closest?.("a.deck-card, a.learn-mode, .dashboard-study a");
      if (link) departure.current = link.getBoundingClientRect();
    }}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar" id="workspace-sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon"><Bloom /></span>
          <span>
            Aksharam
            <span className="brand-sub" lang="ml">
              അക്ഷരം
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" style={{ "--nav-index": Math.max(0, nav.findIndex(n => isActive(path, n))) } as CSSProperties}>
          <span className="nav-indicator" aria-hidden="true" />
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
          <a className="intro-replay" href={publicAssetPath("/#intro")}>Replay intro ↗</a>
          <span className="sidebar-note">A little, every day.</span>
          <ThemeToggle />
          <p className="sidebar-progress">{total} letters learned</p>
        </div>
      </aside>
      <SidebarResize />
      <div className="content-shell">
        <div className="mobile-header">
          <Link href="/" className="mobile-brand">
            Aksharam <span lang="ml">അക്ഷരം</span>
          </Link>
          <ThemeToggle />
        </div>
        <main ref={main} id="main" key={path} className="workspace-page">
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
      <StudyPet />
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
