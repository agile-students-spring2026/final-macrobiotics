import { useState } from "react";

const ACCOUNT_ACTIONS = [
  { id: "signup", label: "Sign up" },
  { id: "login", label: "Log in" }
];

function IntroPage({ onNavigateScreen }) {
  const [accountMode, setAccountMode] = useState("signup");
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [formValues, setFormValues] = useState({
    from: "",
    to: "",
    classType: "",
    date: "",
    airlines: "",
    miles: "",
    travelers: ""
  });

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  function handleAccountAction(nextMode) {
    setAccountMode(nextMode);

    if (onNavigateScreen) {
      onNavigateScreen("login");
    }
  }

  return (
    <section className="screen intro-screen">
      <div className="intro-panel">
        <div className="intro-actions" aria-label="Account actions">
          {ACCOUNT_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={`intro-actions__button ${
                accountMode === action.id ? "is-active" : ""
              }`}
              onClick={() => handleAccountAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>

        <header className="intro-hero">
          <p className="intro-hero__eyebrow">Award travel, simplified.</p>
          <h2 className="intro-hero__title">WELCOME</h2>
          <h2 className="intro-hero__title intro-hero__title--second">TEXT</h2>
          <p className="intro-hero__copy">
            Start with a quick mileage search, then refine with traveler and
            airline preferences.
          </p>
        </header>

        <form className="intro-form" onSubmit={(event) => event.preventDefault()}>
          <div className="intro-form__grid">
            <label className="intro-field">
              <span>From</span>
              <input
                name="from"
                type="text"
                value={formValues.from}
                onChange={handleFieldChange}
                placeholder="Departure city"
              />
            </label>

            <label className="intro-field">
              <span>To</span>
              <input
                name="to"
                type="text"
                value={formValues.to}
                onChange={handleFieldChange}
                placeholder="Destination"
              />
            </label>

            <label className="intro-field">
              <span>Class</span>
              <input
                name="classType"
                type="text"
                value={formValues.classType}
                onChange={handleFieldChange}
                placeholder="Cabin class"
              />
            </label>

            <label className="intro-field">
              <span>Date</span>
              <input
                name="date"
                type="text"
                value={formValues.date}
                onChange={handleFieldChange}
                placeholder="Travel date"
              />
            </label>
          </div>

          <div className="intro-form__actions">
            <button
              type="button"
              className={`intro-secondary-button ${
                showRecentSearches ? "is-active" : ""
              }`}
              onClick={() => setShowRecentSearches((currentValue) => !currentValue)}
            >
              Recent Searches
            </button>

            <button
              type="button"
              className="intro-primary-button"
              onClick={() =>
                onNavigateScreen && onNavigateScreen("search-results")
              }
            >
              Search
            </button>
          </div>

          {showRecentSearches ? (
            <div className="intro-recent-searches" aria-live="polite">
              <div className="intro-recent-searches__item">
                Recent search items will appear here once the search history
                feature is connected.
              </div>
            </div>
          ) : null}

          <div className="intro-advanced">
            <h3 className="intro-advanced__title">Advanced Options</h3>

            <div className="intro-advanced__grid">
              <label className="intro-field">
                <span>Airlines</span>
                <input
                  name="airlines"
                  type="text"
                  value={formValues.airlines}
                  onChange={handleFieldChange}
                  placeholder="Preferred airlines"
                />
              </label>

              <label className="intro-field">
                <span>Min/Max Miles</span>
                <input
                  name="miles"
                  type="text"
                  value={formValues.miles}
                  onChange={handleFieldChange}
                  placeholder="Mileage range"
                />
              </label>

              <label className="intro-field">
                <span>Num of Travellers</span>
                <input
                  name="travelers"
                  type="text"
                  value={formValues.travelers}
                  onChange={handleFieldChange}
                  placeholder="Passenger count"
                />
              </label>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default IntroPage;
