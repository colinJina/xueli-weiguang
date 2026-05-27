import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type VideoDetailIconProps = SVGProps<SVGSVGElement>;

function IconBase({ className, ...props }: VideoDetailIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    />
  );
}

export function VideoUserIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="6.2" r="2.7" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M4.2 15c1.2-2.25 3.12-3.37 5.8-3.37s4.6 1.12 5.8 3.37"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </IconBase>
  );
}

export function VideoArchiveIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <rect
        x="4.1"
        y="4.6"
        width="11.8"
        height="10.8"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6.9 8.2h6.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      <path d="M8.5 10.9h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </IconBase>
  );
}

export function VideoPlayCircleIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="6.1" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8.6 7.5 12.6 10l-4 2.5V7.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="0.35"
      />
    </IconBase>
  );
}

export function VideoHeartIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M10 15.1 4.9 10.2a3.1 3.1 0 0 1 4.4-4.4l.7.7.7-.7a3.1 3.1 0 1 1 4.4 4.4L10 15.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </IconBase>
  );
}

export function VideoBookmarkIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M6.1 4.5h7.8a1.2 1.2 0 0 1 1.2 1.2v10.1l-5.1-3-5.1 3V5.7a1.2 1.2 0 0 1 1.2-1.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path d="M10 6.7v4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
      <path d="M7.8 8.9h4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.25" />
    </IconBase>
  );
}

export function VideoShareIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="5.2" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14.8" cy="5.3" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14.8" cy="14.7" r="1.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="m6.5 9.2 7-3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <path d="m6.5 10.8 7 3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
    </IconBase>
  );
}

export function VideoVisibilityIcon(props: VideoDetailIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="10" cy="10" r="3.1" fill="currentColor" />
    </IconBase>
  );
}

export function VideoPlayIcon({
  className,
  ...props
}: VideoDetailIconProps) {
  return (
    <IconBase className={cn("h-7 w-7", className)} {...props}>
      <path
        d="M7.7 5.8 14 10l-6.3 4.2V5.8Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="0.45"
      />
    </IconBase>
  );
}
