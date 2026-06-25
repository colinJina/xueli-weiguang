import Link from "next/link";

import HomeBrandMarkIcon from "@/components/icons/home/brand-mark.svg";
import { cn } from "@/lib/utils";

type SiteBrandProps = {
  href?: string;
  className?: string;
  titleClassName?: string;
  markClassName?: string;
  subtitle?: string;
  subtitleClassName?: string;
  badge?: string;
  badgeClassName?: string;
};

export function SiteBrand({
  href = "/",
  className,
  titleClassName,
  markClassName,
  subtitle,
  subtitleClassName,
  badge,
  badgeClassName,
}: SiteBrandProps) {
  return (
    <Link className={cn("flex items-center gap-3", className)} href={href}>
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center text-[#c9cbd1]",
          markClassName,
        )}
      >
        <HomeBrandMarkIcon aria-hidden="true" className="h-5 w-5" />
      </span>

      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 leading-none">
          <span
            className={cn(
              "truncate text-[1.85rem] font-bold tracking-[-0.04em] text-white",
              titleClassName,
            )}
          >
            雪笠微光
          </span>
          {badge ? (
            <span
              className={cn(
                "rounded-full border border-white/12 bg-white/[0.03] px-2 py-[3px] font-sans text-[0.6rem] tracking-[0.08em] text-[#c9cbd1]",
                badgeClassName,
              )}
            >
              {badge}
            </span>
          ) : null}
        </span>

        {subtitle ? (
          <span
            className={cn(
              "font-sans text-[0.72rem] tracking-[0.16em] text-[#8b8e97]",
              subtitleClassName,
            )}
          >
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
