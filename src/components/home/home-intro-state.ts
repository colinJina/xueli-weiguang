type HomeIntroStorage = Pick<Storage, "getItem" | "setItem">;

type HomeIntroInitialState = {
  motionReady: boolean;
  shouldPersistIntroSeenAfterIntro: boolean;
  showIntro: boolean;
};

export const homeIntroInitialState = {
  motionReady: false,
  showIntro: true,
};

const introSkippedState: HomeIntroInitialState = {
  motionReady: true,
  shouldPersistIntroSeenAfterIntro: false,
  showIntro: false,
};

export const homeIntroSessionKey = "xueli-weiguang:home-intro-seen";

export function getHomeIntroStorage(): HomeIntroStorage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getHomeIntroInitialState(
  prefersReducedMotion: boolean,
  storage: HomeIntroStorage | null,
): HomeIntroInitialState {
  if (prefersReducedMotion || !storage) {
    return introSkippedState;
  }

  try {
    if (storage.getItem(homeIntroSessionKey) === "1") {
      return introSkippedState;
    }
  } catch {
    return introSkippedState;
  }

  return {
    motionReady: false,
    shouldPersistIntroSeenAfterIntro: true,
    showIntro: true,
  };
}

export function markHomeIntroSeen(storage: HomeIntroStorage | null) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(homeIntroSessionKey, "1");
  } catch {
    // Browser storage can be unavailable in private mode or restricted contexts.
  }
}
