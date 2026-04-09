function AppFrame({ screens, activeScreen, onChangeScreen, children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Milely - Award Travel Made Simple</h1>
        <p className="app-subtitle">
          Award travel options across any airline and loyalty program, all in
          one place.
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
