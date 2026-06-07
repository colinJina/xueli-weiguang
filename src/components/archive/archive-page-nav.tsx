import type { User } from "@supabase/supabase-js";

import { SiteBrand } from "@/components/layout/site-brand";
import { ArchiveSubmitTrigger } from "@/components/archive/archive-submit-trigger";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { IconButton } from "@/components/ui/icon-button";

type ArchivePageNavProps = {
  activeChannel: string;
  channelCount: string;
  supportCount: string;
  user: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onSubmitLoginRequest: () => void;
  onSubmitOpen: () => void;
  onLogout: () => void;
};

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[13px] w-[13px]"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M6 4.75 10.5 8 6 11.25V4.75Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="0.4"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[13px] w-[13px]"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M8 12.5 3.7 8.35A2.7 2.7 0 0 1 7.5 4.6L8 5.1l.5-.5a2.7 2.7 0 0 1 3.8 3.75L8 12.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[17px] w-[17px]"
      fill="none"
      viewBox="0 0 20 20"
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

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[17px] w-[17px]"
      fill="none"
      viewBox="0 0 20 20"
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

function SettingsIcon() {
  return (
    <svg
      className="w-[17px] h-[17px]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
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

function UserIcon({ plus = false }: { plus?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 18 18">
      <circle cx="7" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M2.8 14c.9-2 2.5-3 4.2-3s3.3 1 4.2 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      {plus ? (
        <>
          <path
            d="M13.5 5.2v4.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.3"
          />
          <path
            d="M11.3 7.4h4.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.3"
          />
        </>
      ) : null}
    </svg>
  );
}

export function ArchivePageNav({
  activeChannel,
  channelCount,
  supportCount,
  user,
  onLoginClick,
  onRegisterClick,
  onSubmitLoginRequest,
  onSubmitOpen,
  onLogout,
}: ArchivePageNavProps) {
  const isAuthenticated = Boolean(user);

  return (
    <header className="border-b border-white/[0.06] bg-[rgba(3,3,4,0.94)] backdrop-blur-[14px]">
      <div className="page-container flex min-h-[72px] items-center justify-between gap-5 py-2 max-xl:flex-wrap">
        <div className="flex min-w-0 items-center gap-7 max-xl:flex-wrap">
          <SiteBrand
            badge="BETA"
            className="gap-3"
            subtitle="VIDEO ARCHIVE"
            titleClassName="max-md:text-[1.45rem]"
          />

          <div
            className="flex items-center gap-2.5 max-md:flex-wrap "
            aria-label="频道状态"
          >
            <Chip
              aria-current="page"
              className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%),rgba(255,255,255,0.05)] text-foreground"
              size="sm"
              variant="strong"
            >
              <PlayIcon />
              <span className="text-base">{activeChannel}</span>
              <Chip size="count" variant="count">
                {channelCount}
              </Chip>
            </Chip>

            <Chip aria-label={`支持 ${supportCount}`} size="sm">
              <HeartIcon />
              <span className="text-base">支持</span>
              <Chip size="count" variant="count">
                {supportCount}
              </Chip>
            </Chip>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 max-xl:w-full max-xl:justify-start">
          <div
            className="flex items-center gap-2.5 max-md:flex-wrap"
            aria-label="工具栏"
          >
            <IconButton aria-label="搜索">
              <SearchIcon />
            </IconButton>
            <IconButton aria-label="通知">
              <BellIcon />
            </IconButton>
            <IconButton aria-label="设置">
              <SettingsIcon />
            </IconButton>
          </div>

          <div
            className="flex items-center gap-2.5 max-md:flex-wrap"
            aria-label="账户操作"
          >
            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={onLogout} variant="expanded" />
            ) : (
              <>
                <Button
                  onClick={onLoginClick}
                  size="md"
                  type="button"
                  variant="pill"
                >
                  <UserIcon />
                  <span>登录</span>
                </Button>
                <Button
                  onClick={onRegisterClick}
                  size="md"
                  type="button"
                  variant="pill"
                >
                  <UserIcon plus />
                  <span>注册</span>
                </Button>
              </>
            )}
          </div>

          <ArchiveSubmitTrigger
            isAuthenticated={isAuthenticated}
            onRequestLogin={onSubmitLoginRequest}
            onRequestSubmit={onSubmitOpen}
          />
        </div>
      </div>
    </header>
  );
}
