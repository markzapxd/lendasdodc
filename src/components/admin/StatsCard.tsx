interface StatsCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <section className="rounded-2xl border border-[#2b1742]/60 bg-[#12081a]/60 p-5 shadow-md transition-all hover:border-[#ec195a]/40 hover:bg-[#180a24]">
      <div className="text-xs font-mono text-[#a595b8]">{title}</div>
      <div className="my-2 text-3xl font-black text-white">{value}</div>
      {description ? <div className="text-xs text-[#a595b8]/70">{description}</div> : null}
    </section>
  );
}
