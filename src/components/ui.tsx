import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      {/* A full-width fill slid left, not a width change: it animates on
          the GPU and keeps its rounded end. */}
      <div
        style={{
          transform: `translateX(${Math.min(100, Math.max(0, value)) - 100}%)`,
        }}
      />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="heading-content">
        <div className="heading-copy">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <div className="heading-title">
            <h1>{title}</h1>
          </div>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
export function ArrowLink() {
  return <ArrowUpRight size={18} aria-hidden="true" />;
}
