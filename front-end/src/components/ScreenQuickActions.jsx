function ScreenQuickActions({ activeScreen, onNavigateScreen }) {
  const actions = [
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M7 3.75A1.75 1.75 0 0 0 5.25 5.5v14.7c0 .45.5.71.86.45L12 16.7l5.89 3.95c.36.26.86 0 .86-.45V5.5A1.75 1.75 0 0 0 17 3.75H7Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="m9.75 4.5.39 1.53a6.9 6.9 0 0 1 1.86 0l.39-1.53h2.36l.55 1.48a6.9 6.9 0 0 1 1.61.93l1.5-.55 1.67 1.67-.55 1.5c.37.5.68 1.04.92 1.61l1.49.55v2.36l-1.49.55a6.9 6.9 0 0 1-.92 1.61l.55 1.5-1.67 1.67-1.5-.55a6.9 6.9 0 0 1-1.61.92l-.55 1.49H9.75l-.55-1.49a6.9 6.9 0 0 1-1.61-.92l-1.5.55-1.67-1.67.55-1.5a6.9 6.9 0 0 1-.92-1.61l-1.49-.55V11.3l1.49-.55c.24-.57.55-1.11.92-1.61l-.55-1.5L6.09 5.9l1.5.55c.5-.37 1.04-.68 1.61-.93l.55-1.48h2.36Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12.5"
            r="2.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="screen-quick-actions" aria-label="Quick actions">
      {actions.map((action) => {
        const isActive = activeScreen === action.id;

        return (
          <button
            key={action.id}
            type="button"
            className={`screen-quick-actions__button${
              isActive ? " is-active" : ""
            }`}
            onClick={() => onNavigateScreen && onNavigateScreen(action.id)}
            disabled={isActive}
            aria-label={action.label}
            title={action.label}
          >
            {action.icon}
          </button>
        );
      })}
    </div>
  );
}

export default ScreenQuickActions;
