function AppFrame({ screens, activeScreen, onChangeScreen, children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Milely Front-End Framework</h1>
        <p className="app-subtitle">
          Sprint 1 scaffold with seven React screens.
        </p>
      </header>

      <nav className="screen-nav" aria-label="Application screens">
        {screens.map((screen) => (
          <button
            key={screen.id}
            type="button"
            className={`screen-nav__button ${
              activeScreen === screen.id ? "is-active" : ""
            }`}
            onClick={() => onChangeScreen(screen.id)}
          >
            {screen.label}
          </button>
        ))}
      </nav>

      <main className="screen-canvas">{children}</main>
    </div>
  );
}

export default AppFrame;
