import type * as React from "react";

type SectionProps = {
  readonly title: string;
  readonly children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section
      aria-labelledby={`${title}-heading`}
      className="grid gap-6 border-t border-border pt-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`${title}-heading`} className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-text-secondary">
          primitive
        </span>
      </div>
      {children}
    </section>
  );
}

export { Section };
