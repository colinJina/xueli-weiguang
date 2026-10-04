import BilibiliIcon from "@/components/icons/source/bilibili.svg";
import YoutubeIcon from "@/components/icons/source/youtube.svg";
import PlayIcon from "@/components/icons/source/generic-play.svg";
import { Chip } from "@/components/ui/chip";

export function SourceBadge({ platform, label }: { platform: string | null; label: string }) {
  const Icon = platform === "bilibili" ? BilibiliIcon : platform === "youtube" ? YoutubeIcon : PlayIcon;
  return <Chip size="xs" variant="overlay">
    <Icon aria-hidden="true" className="h-5 w-5" />
    <span className="min-w-0 truncate">{label}</span>
  </Chip>;
}
