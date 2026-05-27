import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type HomeIconProps = SVGProps<SVGSVGElement>;

export function HomeBrandMark({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        d="M12 3.5 21 19H3L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
      <path d="M12 7.5V14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M9.5 14.5H14.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

export function HomeSearchIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <circle cx="9" cy="9" r="4.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.7 12.7 3.6 3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function HomeBellIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M10 4.2a3.6 3.6 0 0 0-3.6 3.6v2.3c0 .7-.2 1.3-.6 1.9l-1 1.4h10.4l-1-1.4a3.2 3.2 0 0 1-.6-1.9V7.8A3.6 3.6 0 0 0 10 4.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M8.3 14.4a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function HomeUploadIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path d="M10 13.4V4.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path d="m6.8 8 3.2-3.2L13.2 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M4.6 14.8h10.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function HomeImageIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-6 w-6", className)}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <rect x="4.25" y="5.25" width="15.5" height="13.5" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m8 15 2.6-2.9a1 1 0 0 1 1.5.04L15 15l1.6-1.8a1 1 0 0 1 1.5.02L20 15.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

export function HomeCogIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M10 4.6 11.2 3l1.8 1 .2 2 1.8.8 1.8-1 1.2 1.6-1.1 1.8.5 2 1.8 1-.7 2-2 .1-1.3 1.6.3 2-2 .7-1.2-1.6H9l-1.2 1.6-2-.7.3-2-1.3-1.6-2-.1-.7-2 1.8-1 .5-2L2.8 6.6 4 5l1.8 1 1.8-.8.2-2 1.8-1L10 4.6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function HomeLoginIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path d="M8 5.2H4.8A1.8 1.8 0 0 0 3 7v6a1.8 1.8 0 0 0 1.8 1.8H8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M10.2 6.4 13.8 10l-3.6 3.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M6.8 10h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function HomePlayIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path d="M7.2 5.9 13.2 10l-6 4.1V5.9Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="0.4" />
    </svg>
  );
}

export function HomeHeartIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M10 15.3 4.9 10.4a3.2 3.2 0 0 1 4.5-4.6l.6.6.6-.6a3.2 3.2 0 1 1 4.5 4.6L10 15.3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HomeFlameIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M10.1 3.6c.8 2.1-.4 3.7-1.5 5 .9-.3 1.9-.7 2.8-1.5 1.4 1.1 2.5 2.8 2.5 4.7A4.4 4.4 0 0 1 9.5 16a4 4 0 0 1-3.4-6.2c.8-1.2 1.8-2 2.7-2.8.8-.8 1.5-1.6 1.3-3.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HomeEyeIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M2.8 10s2.5-4.2 7.2-4.2S17.2 10 17.2 10s-2.5 4.2-7.2 4.2S2.8 10 2.8 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
