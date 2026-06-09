import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

import {
  userArchiveCards,
  userArchiveProfile,
  userCollections,
  userTags,
  type UserArchiveCard,
} from "./user-profile-data";

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path d="M4 4h5v5H4V4Zm7 0h5v5h-5V4ZM4 11h5v5H4v-5Zm7 0h5v5h-5v-5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path d="M4 5.5h12M4 10h12M4 14.5h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12 12 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function FolderIcon({ active = false }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M3.5 6.5c0-.95.65-1.6 1.6-1.6h3l1.3 1.35H15c.95 0 1.6.65 1.6 1.6v5.85c0 .95-.65 1.6-1.6 1.6H5.1c-.95 0-1.6-.65-1.6-1.6V6.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      {active ? <path d="M7.2 10.2h5.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.45" /> : null}
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M2 8s2-3.5 6-3.5S14 8 14 8s-2 3.5-6 3.5S2 8 2 8Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 12.8S3.2 10 3.2 6.6c0-1.4 1-2.4 2.3-2.4.9 0 1.6.45 2 1.1.4-.65 1.1-1.1 2-1.1 1.3 0 2.3 1 2.3 2.4C11.8 10 8 12.8 8 12.8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function SourceIcon({ source }: { source: UserArchiveCard["source"] }) {
  if (source === "youtube") {
    return (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 18 18">
        <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.5" width="14" x="2" y="4" />
        <path d="m8 7 3 2-3 2V7Z" fill="currentColor" />
      </svg>
    );
  }

  if (source === "link") {
    return (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 18 18">
        <path d="M7.6 5.7 8.8 4.5a3 3 0 0 1 4.2 4.2l-1.4 1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M10.4 12.3 9.2 13.5a3 3 0 0 1-4.2-4.2l1.4-1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        <path d="m7.2 10.8 3.6-3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m7.8 6.4 4 2.6-4 2.6V6.4Z" fill="currentColor" />
    </svg>
  );
}

export function UserProfileShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[300px] flex-col border-r border-border bg-panel px-4 py-7 lg:flex">
        <SidebarContent />
      </aside>

      <div className="min-h-screen lg:pl-[300px]">
        <TopBar />

        <main className="px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
          <CollectionHeader />
          <FilterRow />
          <CardGrid />
        </main>
      </div>
    </div>
  );
}

function SidebarContent() {
  return (
    <>
      <div className="flex items-center gap-4 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-11 w-11 rounded-full border border-white/10 object-cover"
          referrerPolicy="no-referrer"
          src={userArchiveProfile.avatarUrl}
        />
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">{userArchiveProfile.name}</p>
          <p className="mt-1 truncate text-sm text-subtle">{userArchiveProfile.role}</p>
        </div>
      </div>

      <Button className="mt-10 min-h-[52px] w-full gap-3 rounded-lg text-base" type="button">
        <PlusIcon />
        <span>Upload New Video</span>
      </Button>

      <nav className="mt-10 space-y-7">
        <button className="flex w-full items-center gap-4 rounded-lg px-5 py-3 text-left text-base font-medium text-muted transition hover:bg-white/[0.035] hover:text-foreground" type="button">
          <GridIcon />
          <span>全部视频</span>
        </button>

        <div>
          <p className="px-3 font-sans text-xs uppercase tracking-[0.18em] text-subtle">
            Collection Folders
          </p>
          <div className="mt-4 space-y-2">
            {userCollections.map((collection) => (
              <button
                aria-pressed={collection.active}
                className={cn(
                  "flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left text-base font-semibold transition",
                  collection.active
                    ? "border-white/10 bg-white/[0.07] text-foreground"
                    : "border-transparent text-muted hover:bg-white/[0.035] hover:text-foreground",
                )}
                key={collection.id}
                type="button"
              >
                <FolderIcon active={collection.active} />
                <span className="min-w-0 flex-1 truncate">{collection.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-border bg-background/92 px-5 backdrop-blur-sm sm:px-8 lg:px-10">
      <div className="flex items-center gap-3 lg:hidden">
        <div className="h-9 w-9 rounded-full border border-white/10 bg-panel" />
        <div>
          <p className="text-sm font-bold text-foreground">{userArchiveProfile.name}</p>
          <p className="text-xs text-subtle">{userArchiveProfile.role}</p>
        </div>
      </div>

      <div className="ml-auto flex rounded-lg border border-border bg-panel p-1">
        <IconButton aria-label="网格视图" className="rounded-md bg-white/[0.08] text-foreground" size="sm" variant="ghost">
          <GridIcon />
        </IconButton>
        <IconButton aria-label="列表视图" className="rounded-md" size="sm" variant="ghost">
          <ListIcon />
        </IconButton>
      </div>
    </header>
  );
}

function CollectionHeader() {
  return (
    <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-black leading-tight tracking-[-0.04em] text-foreground md:text-[2.35rem]">
          健身训练
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-muted md:text-lg">
          A curated collection of high-end motion design and typography references.
        </p>
      </div>
      <p className="font-sans text-sm uppercase tracking-[0.02em] text-subtle">24 ITEMS</p>
    </section>
  );
}

function FilterRow() {
  return (
    <section className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <label className="relative block w-full min-w-[240px] max-w-[350px] sm:w-[350px]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle">
            <SearchIcon />
          </span>
          <input
            className="h-12 w-full rounded-full border border-border bg-white/[0.1] px-5 pl-12 text-base font-semibold text-foreground outline-none transition placeholder:text-muted focus:border-borderStrong focus:bg-white/[0.13]"
            placeholder="搜索标签..."
            type="search"
          />
        </label>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {userTags.map((tag) => (
            <Chip key={tag.id} size="sm" variant={tag.active ? "selected" : "default"}>
              <span>{tag.name}</span>
              {tag.active ? (
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14">
                  <path d="m4 4 6 6m0-6-6 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              ) : null}
            </Chip>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 text-sm text-subtle transition hover:text-foreground" type="button">
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 4h10l-4 4v3l-2 1V8L3 4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
          <path d="m3 13 10-10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
        </svg>
        <span>清空筛选</span>
      </button>
    </section>
  );
}

function CardGrid() {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {userArchiveCards.map((card) => (
        <ArchiveCard item={card} key={card.id} />
      ))}
    </section>
  );
}

function ArchiveCard({ item }: { item: UserArchiveCard }) {
  return (
    <article className="group flex min-h-[352px] flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-panel transition duration-200 hover:-translate-y-0.5 hover:border-white/14">
      <div className={cn("relative overflow-hidden bg-surface", item.tall ? "aspect-[4/5]" : "aspect-video")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={item.coverUrl}
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 font-sans text-sm font-bold text-foreground">
          {item.duration}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 min-h-[3.35rem] text-xl font-bold leading-snug tracking-[-0.03em] text-foreground">
          {item.title}
        </h2>

        <div className="mt-auto flex items-center justify-between gap-3 pt-8 text-sm text-muted">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <EyeIcon />
              {item.viewCountLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <HeartIcon />
              {item.likeCountLabel}
            </span>
          </div>
          <span className="shrink-0 text-muted">
            <SourceIcon source={item.source} />
          </span>
        </div>
      </div>
    </article>
  );
}
