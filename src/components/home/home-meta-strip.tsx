import type { HomeMetaStripItem } from "@/components/home/home-content";

type HomeMetaStripProps = {
  items: readonly HomeMetaStripItem[];
};

export function HomeMetaStrip({ items }: HomeMetaStripProps) {
  return (
    <section className="border-y border-white/6 bg-[#111112]">
      <div className="page-container flex flex-wrap items-center gap-x-5 gap-y-3 py-5 text-xs">
        {items.map((item, index) => (
          <div className="flex items-center gap-3" key={item.label}>
            <span className="font-sans uppercase tracking-[0.18em] text-subtle">{item.label}</span>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
            {index < items.length - 1 ? (
              <span aria-hidden="true" className="h-3 w-px bg-white/12" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
