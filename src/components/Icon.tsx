type IconName =
  | "speaker"
  | "mic"
  | "stop"
  | "send"
  | "back"
  | "close"
  | "arrow"
  | "up"
  | "check"
  | "replay"
  | "rain"
  | "scene"
  | "branch"
  | "user"
  | "leaf";

const PATHS: Record<IconName, React.ReactNode> = {
  speaker: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="2" />,
  send: (
    <>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  // 上げる: a step up.
  up: (
    <>
      <path d="M4 19h5v-5h5V9h6" />
      <path d="M16 5l4 4-4 4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  replay: (
    <>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  // 浴びる: sentences falling like rain, as in ことのあめ.
  rain: (
    <>
      <path d="M7 13.5h10a3.5 3.5 0 0 0 .2-7A5 5 0 0 0 7.7 7.6 3 3 0 0 0 7 13.5z" />
      <path d="M9 17v2.5" />
      <path d="M12 16.5v4" />
      <path d="M15 17v2.5" />
    </>
  ),
  // 場面で言う: someone's line, and yours to come.
  scene: (
    <>
      <path d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-3 2.5V12a2 2 0 0 1-2-2z" />
      <path d="M12 17h7" />
      <path d="M15 20h4" />
    </>
  ),
  // 枝: a branch growing up, forking.
  branch: (
    <>
      <path d="M12 21V10" />
      <path d="M12 14c0-3 2.5-5 6-5.5" />
      <path d="M12 11.5C12 8.5 9.5 6.5 6 6" />
      <path d="M18 8.5c.4-2 0-3.5-1-4.5-1 1.2-1.3 2.8-1 4.3" />
      <path d="M6 6c-.6-1.8-.3-3.3.7-4.3 1 1.1 1.3 2.6 1 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  // A word the learner has made their own: a leaf.
  leaf: (
    <>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" />
      <path d="M5 19l8-8" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
