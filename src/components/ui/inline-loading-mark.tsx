import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import { cn } from "@/lib/utils";

type InlineLoadingMarkProps = { className?: string; label?: string };
export function InlineLoadingMark({ className, label = "正在加载" }: InlineLoadingMarkProps) {
 return <span role="status" aria-label={label} className={cn("inline-flex h-5 w-5 items-center justify-center text-foreground",className)}>
   <SpinnerIcon aria-hidden="true" className="h-full w-full animate-spin motion-reduce:animate-none" />
 </span>;
}
