import { useState } from "react";

interface StateBadgeProps {
  state: string;
}

const stateColors: Record<string, string> = {
  OBSERVE: "badge-info",
  UNDERSTAND: "badge-info",
  QUESTION: "badge-info",
  VALIDATE: "badge-primary",
  CONNECT: "badge-primary",
  CHALLENGE: "badge-warning",
  DISCOVER: "badge-success",
  EVOLVE: "badge-success",
  COMPLETED: "badge-success",
  FAILED: "badge-danger",
  BLOCKED: "badge-danger",
};

export function StateBadge({ state }: StateBadgeProps) {
  const colorClass = stateColors[state] ?? "badge-info";
  return <span className={`badge ${colorClass}`}>{state}</span>;
}

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <div
        className="card-title"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(!open)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
      >
        {open ? "▼" : "▶"} {title}
      </div>
      {open && children}
    </div>
  );
}
