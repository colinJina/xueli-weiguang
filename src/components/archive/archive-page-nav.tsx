import type { User } from "@supabase/supabase-js";

import { SiteBrand } from "@/components/layout/site-brand";
import { ArchiveSubmitTrigger } from "@/components/archive/archive-submit-trigger";
import { UserMenu } from "@/components/auth/user-menu";
import ArchiveBellIcon from "@/components/icons/archive/bell.svg";
import ArchiveHeartIcon from "@/components/icons/archive/nav-heart.svg";
import ArchivePlayIcon from "@/components/icons/archive/nav-play.svg";
import ArchiveSearchIcon from "@/components/icons/archive/search.svg";
import ArchiveSettingsIcon from "@/components/icons/archive/settings.svg";
import ArchiveUserIcon from "@/components/icons/archive/user.svg";
import ArchiveUserPlusIcon from "@/components/icons/archive/user-plus.svg";
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
              <ArchivePlayIcon aria-hidden="true" className="h-[13px] w-[13px]" />
              <span className="text-base">{activeChannel}</span>
              <Chip size="count" variant="count">
                {channelCount}
              </Chip>
            </Chip>

            <Chip aria-label={`支持 ${supportCount}`} size="sm">
              <ArchiveHeartIcon aria-hidden="true" className="h-[13px] w-[13px]" />
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
              <ArchiveSearchIcon aria-hidden="true" className="h-[17px] w-[17px]" />
            </IconButton>
            <IconButton aria-label="通知">
              <ArchiveBellIcon aria-hidden="true" className="h-[17px] w-[17px]" />
            </IconButton>
            <IconButton aria-label="设置">
              <ArchiveSettingsIcon aria-hidden="true" className="h-[17px] w-[17px]" />
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
                  <ArchiveUserIcon aria-hidden="true" className="h-4 w-4" />
                  <span>登录</span>
                </Button>
                <Button
                  onClick={onRegisterClick}
                  size="md"
                  type="button"
                  variant="pill"
                >
                  <ArchiveUserPlusIcon aria-hidden="true" className="h-4 w-4" />
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
