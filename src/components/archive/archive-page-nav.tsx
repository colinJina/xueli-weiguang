type ArchivePageNavProps = {
  activeChannel: string;
  channelCount: string;
  supportCount: string;
};

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="archive-brand-mark"
      fill="none"
      viewBox="0 0 24 24"
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

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="archive-pill-icon" fill="none" viewBox="0 0 16 16">
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
    <svg aria-hidden="true" className="archive-pill-icon" fill="none" viewBox="0 0 16 16">
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
    <svg aria-hidden="true" className="archive-tool-svg" fill="none" viewBox="0 0 20 20">
      <circle cx="9" cy="9" r="4.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.7 12.7 3.6 3.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="archive-tool-svg" fill="none" viewBox="0 0 20 20">
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

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="archive-tool-svg" fill="none" viewBox="0 0 20 20">
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

function UserIcon({ plus = false }: { plus?: boolean }) {
  return (
    <svg aria-hidden="true" className="archive-auth-svg" fill="none" viewBox="0 0 18 18">
      <circle cx="7" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.8 14c.9-2 2.5-3 4.2-3s3.3 1 4.2 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
      {plus ? (
        <>
          <path d="M13.5 5.2v4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
          <path d="M11.3 7.4h4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
        </>
      ) : null}
    </svg>
  );
}

export function ArchivePageNav({
  activeChannel,
  channelCount,
  supportCount,
}: ArchivePageNavProps) {
  return (
    <header className="archive-page-nav">
      <div className="page-container archive-page-nav__inner">
        <div className="archive-page-nav__cluster">
          <div className="archive-brand">
            <div className="archive-brand__mark-wrap">
              <BrandMark />
            </div>
            <div className="archive-brand__copy">
              <div className="archive-brand__title-row">
                <span className="archive-brand__title">雪笠微光</span>
                <span className="archive-beta-badge">BETA</span>
              </div>
              <span className="archive-brand__subtitle">VIDEO ARCHIVE</span>
            </div>
          </div>

          <div className="archive-page-nav__status" aria-label="频道状态">
            <div
              aria-current="page"
              className="archive-status-pill archive-status-pill--active"
            >
              <PlayIcon />
              <span>{activeChannel}</span>
              <span className="archive-status-pill__count">{channelCount}</span>
            </div>

            <div className="archive-status-pill" aria-label={`支持 ${supportCount}`}>
              <HeartIcon />
              <span>支持</span>
              <span className="archive-status-pill__count">{supportCount}</span>
            </div>
          </div>
        </div>

        <div className="archive-page-nav__actions">
          <div className="archive-page-nav__tools" aria-label="工具栏">
            <button aria-label="搜索" className="archive-tool-button" type="button">
              <SearchIcon />
            </button>
            <button aria-label="通知" className="archive-tool-button" type="button">
              <BellIcon />
            </button>
            <button aria-label="设置" className="archive-tool-button" type="button">
              <SettingsIcon />
            </button>
          </div>

          <div className="archive-page-nav__auth" aria-label="账号操作">
            <button className="archive-auth-button" type="button">
              <UserIcon />
              <span>登录</span>
            </button>
            <button className="archive-auth-button" type="button">
              <UserIcon plus />
              <span>注册</span>
            </button>
          </div>

          <button className="archive-submit-button" type="button">
            <span aria-hidden="true" className="archive-submit-button__plus">
              +
            </span>
            <span>推荐投稿</span>
          </button>
        </div>
      </div>
    </header>
  );
}
