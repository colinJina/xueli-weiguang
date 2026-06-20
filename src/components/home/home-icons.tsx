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
      <path
        d="M12 7.5V14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        d="M9.5 14.5H14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
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
      <path
        d="m12.7 12.7 3.6 3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function HomeCompassIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <circle cx="10" cy="10" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m8.1 11.9 1.45-4.15 4.15-1.45-1.45 4.15-4.15 1.45Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <circle cx="10" cy="10" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function HomeArchiveIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <rect
        x="3.4"
        y="4.3"
        width="13.2"
        height="11.4"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.4 8.2h7.2M6.4 11.3h4.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HomeProfileIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <circle cx="10" cy="7.1" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M5.2 15.2a4.8 4.8 0 0 1 9.6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
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
      <path
        d="M8.3 14.4a1.8 1.8 0 0 0 3.4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
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
      <path
        d="M10 13.4V4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="m6.8 8 3.2-3.2L13.2 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M4.6 14.8h10.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
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
      <rect
        x="4.25"
        y="5.25"
        width="15.5"
        height="13.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m8 15 2.6-2.9a1 1 0 0 1 1.5.04L15 15l1.6-1.8a1 1 0 0 1 1.5.02L20 15.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function HomeCogIcon({ className, ...props }: HomeIconProps) {
  return (
    <svg
      className="w-[17px] h-[17px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}

    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      ></path>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      ></path>
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
      <path
        d="M8 5.2H4.8A1.8 1.8 0 0 0 3 7v6a1.8 1.8 0 0 0 1.8 1.8H8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M10.2 6.4 13.8 10l-3.6 3.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M6.8 10h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
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
      <path
        d="M7.2 5.9 13.2 10l-6 4.1V5.9Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="0.4"
      />
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
