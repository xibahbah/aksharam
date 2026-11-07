import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Backwaters, Pookalam } from "./kerala-motifs";
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
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
            <Pookalam className="heading-pookalam" />
            <h1>{title}</h1>
          </div>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      <Backwaters className="heading-backwaters" />
    </header>
  );
}
export function ArrowLink() {
  return <ArrowUpRight size={18} aria-hidden="true" />;
}
