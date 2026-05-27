import Link from "next/link";

import type { HomeHeroContent } from "@/components/home/home-content";
import { HomePlayIcon } from "@/components/home/home-icons";
import { cn } from "@/lib/utils";

type HomeHeroProps = {
  content: HomeHeroContent;
};

const heroPanelClassName =
  "absolute bg-gradient-to-b from-white/20 via-white/6 to-transparent";

const heroBeamClassName =
  "absolute w-3 rounded-full bg-gradient-to-b from-white/90 via-white/16 to-transparent blur-[1px]";

export function HomeHero({ content }: HomeHeroProps) {
  return (
    <section className="relative min-h-[760px] overflow-hidden bg-[#090909] pt-[72px] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.78))]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:76px_76px] opacity-[0.12]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.14),transparent_22%,transparent_78%,rgba(255,255,255,0.14)),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_18%,rgba(0,0,0,0.55)_76%)]" />

      <div className="absolute inset-y-0 left-[3%] w-[17%] bg-gradient-to-b from-white/10 via-white/0 to-black/35" />
      <div className="absolute inset-y-0 right-[3%] w-[17%] bg-gradient-to-b from-white/10 via-white/0 to-black/35" />

      <div className="pointer-events-none absolute inset-y-[9%] left-1/2 w-[42%] -translate-x-1/2 opacity-90 max-lg:w-[52%] max-md:right-[4%] max-md:left-auto max-md:w-[56%] max-md:translate-x-0 max-md:opacity-40">
        <span className={cn(heroBeamClassName, "left-[16%] top-0 h-[78%]")} />
        <span className={cn(heroBeamClassName, "left-[44%] -top-[2%] h-[82%]")} />
        <span className={cn(heroBeamClassName, "right-[12%] top-[22%] h-[44%]")} />

        <span
          className={cn(
            heroPanelClassName,
            "left-[12%] top-[9%] h-[28%] w-[18%] [clip-path:polygon(12%_0,100%_0,100%_88%,0_100%,0_20%)]",
          )}
        />
        <span
          className={cn(
            heroPanelClassName,
            "left-[27%] top-[5%] h-[66%] w-[27%] border border-white/10 bg-gradient-to-b from-white/18 via-white/[0.08] to-transparent [clip-path:polygon(0_0,74%_4%,74%_100%,16%_100%,0_34%)]",
          )}
        />
        <span
          className={cn(
            heroPanelClassName,
            "left-[46%] top-[13%] h-[58%] w-[26%] border border-white/8 bg-gradient-to-b from-white/12 via-white/[0.06] to-transparent [clip-path:polygon(0_10%,100%_6%,100%_72%,16%_100%,0_42%)]",
          )}
        />

        <span className="absolute left-[18%] top-[8%] h-[72%] w-[48%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_62%)] blur-[22px]" />
        <span className="absolute left-[20%] top-[6%] h-[78%] w-[52%] bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.6))]" />
      </div>

      <div className="page-container relative flex min-h-[688px] items-center">
        <div className="max-w-[58rem] pb-20 pt-10">

          <div className="mt-10 space-y-8">
            <h1 className="font-sans text-[5.7rem] font-normal leading-[0.94] tracking-[-0.065em] text-white max-lg:text-[4.7rem] max-md:max-w-[22rem] max-md:text-[3.7rem] max-sm:text-[3rem]">
              {content.title}
            </h1>

            <div className="max-w-[48rem] space-y-2 text-[1rem] leading-[1.75] text-[#b0b5be] sm:text-[1.15rem]">
              <p>{content.description}</p>
              <p>{content.note}</p>
            </div>
          </div>

          <div className="mt-11 flex flex-wrap items-center gap-4">
            {content.actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "inline-flex min-h-14 items-center justify-center rounded-[14px] border px-8 text-[1.5rem] font-semibold tracking-[-0.03em] transition duration-200 hover:-translate-y-px max-sm:min-h-12 max-sm:px-6 max-sm:text-[1.15rem]",
                  index === 0
                    ? "gap-3 border-white bg-white text-black hover:bg-[#f5f5f3]"
                    : "border-white/70 bg-transparent text-white hover:border-white hover:bg-white/6",
                )}
              >
                {index === 0 ? <HomePlayIcon className="h-5 w-5" /> : null}
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
