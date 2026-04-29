import { useEffect, useRef, useState } from "react";
import { apiClient } from "../api/apiClient";
import { loadRecentSearches, saveRecentSearch } from "../utils/recentSearches";

const ACCOUNT_ACTIONS = [
  { id: "signup", label: "Sign up" },
  { id: "login", label: "Log in" },
];

const CABIN_OPTIONS = [
  { value: "", label: "Select cabin class" },
  { value: "economy", label: "Economy" },
  { value: "premium-economy", label: "Premium Economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const TRAVELER_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
];

function IntroPage({ isAuthenticated, onNavigateScreen, onStartSearch }) {
  const [accountMode, setAccountMode] = useState("signup");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const dateInputRef = useRef(null);
  const [formValues, setFormValues] = useState({
    from: "",
    to: "",
    classType: "",
    date: "",
    airlines: "",
    miles: "",
    travelers: "1",
  });

  useEffect(() => {
    if (isAuthenticated) {
      apiClient("/api/recent-searches")
        .then((res) => res.json())
        .then((json) => {
          if (Array.isArray(json.data)) {
            setRecentSearches(json.data);
          }
        })
        .catch(() => {
          setRecentSearches(loadRecentSearches());
        });
      return;
    }

    setRecentSearches(loadRecentSearches());
  }, [isAuthenticated]);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === "from" || name === "to" ? value.toUpperCase() : value,
    }));
  }

  function handleAccountAction(nextMode) {
    setAccountMode(nextMode);

    if (onNavigateScreen) {
      onNavigateScreen("login");
    }
  }

  function handleDatePickerOpen() {
    if (!dateInputRef.current) {
      return;
    }

    if (typeof dateInputRef.current.showPicker === "function") {
      dateInputRef.current.showPicker();
      return;
    }

    dateInputRef.current.focus();
  }

  async function persistRecentSearch(criteria) {
    const searchEntry = {
      origin: (criteria.from ?? "").trim().toUpperCase(),
      destination: (criteria.to ?? "").trim().toUpperCase(),
      travelDate: criteria.date ?? "",
      tripType: "One-way",
      cabin: criteria.classType
        ? criteria.classType
            .split("-")
            .map(
              (segment) => segment.charAt(0).toUpperCase() + segment.slice(1),
            )
            .join(" ")
        : "Any Cabin",
      preferredAirline: criteria.airlines || "Any Airline",
      travelers: criteria.travelers || 1,
      milesRange: criteria.miles || "Any",
      searchedAt: new Date().toISOString().slice(0, 10),
    };

    const nextLocalRecentSearches = saveRecentSearch(searchEntry);
    setRecentSearches(nextLocalRecentSearches);

    if (!isAuthenticated) {
      return;
    }

    try {
      const response = await apiClient("/api/recent-searches", {
        method: "POST",
        body: JSON.stringify(searchEntry),
      });
      const responseJson = await response.json();
      if (response.ok && Array.isArray(responseJson.data)) {
        setRecentSearches(responseJson.data);
      }
    } catch (_error) {}
  }

  async function handleSearchClick() {
    if (!onStartSearch) {
      onNavigateScreen && onNavigateScreen("search-results");
      return;
    }

    const criteria = {
      from: formValues.from.trim().toUpperCase(),
      to: formValues.to.trim().toUpperCase(),
      date: formValues.date,
      classType: formValues.classType,
      airlines: formValues.airlines,
      miles: formValues.miles,
      travelers: formValues.travelers,
    };

    const result = await onStartSearch(criteria);

    if (result?.ok) {
      await persistRecentSearch(criteria);
    }
  }

  async function handleRecentSearchClick(search) {
    const nextFormValues = {
      from: search.origin,
      to: search.destination,
      classType:
        search.cabin === "Any Cabin"
          ? ""
          : search.cabin.toLowerCase().replace(/\s+/g, "-"),
      date: search.travelDate,
      airlines:
        search.preferredAirline === "Any Airline"
          ? ""
          : search.preferredAirline,
      miles: search.milesRange === "Any" ? "" : search.milesRange,
      travelers: String(search.travelers || 1),
    };

    setFormValues(nextFormValues);

    if (!onStartSearch) {
      onNavigateScreen && onNavigateScreen("search-results");
      return;
    }

    const result = await onStartSearch(nextFormValues);

    if (result?.ok) {
      await persistRecentSearch(nextFormValues);
    }
  }

  return (
    <section className="screen intro-screen">
      <div className="intro-panel">
        <div
          className={`intro-actions${
            isAuthenticated ? " intro-actions--authenticated" : ""
          }`}
          aria-label="Account actions"
        >
          {isAuthenticated ? (
            <button
              type="button"
              className="intro-settings-button"
              onClick={() => onNavigateScreen && onNavigateScreen("settings")}
              aria-label="Settings"
              title="Settings"
            >
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
            </button>
          ) : (
            ACCOUNT_ACTIONS.map((action) => (
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
            ))
          )}
        </div>

        <header className="intro-hero">
          <p className="intro-hero__eyebrow">Award travel, simplified.</p>
          <h2 className="intro-hero__title">MILELY</h2>
          <p className="intro-hero__copy">
            Start with a quick mileage search, then refine with traveler and
            airline preferences.
          </p>
        </header>

        <form
          className="intro-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="intro-form__grid">
            <label className="intro-field">
              <span>From</span>
              <input
                name="from"
                type="text"
                value={formValues.from}
                onChange={handleFieldChange}
                placeholder="Departure airport"
                maxLength={3}
              />
            </label>

            <label className="intro-field">
              <span>To</span>
              <input
                name="to"
                type="text"
                value={formValues.to}
                onChange={handleFieldChange}
                placeholder="Arrival airport"
                maxLength={3}
              />
            </label>

            <label className="intro-field">
              <span>Class</span>
              <select
                name="classType"
                value={formValues.classType}
                onChange={handleFieldChange}
              >
                {CABIN_OPTIONS.map((option) => (
                  <option
                    key={option.value || "placeholder"}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="intro-field">
              <span>Date</span>
              <div className="intro-date-input">
                <input
                  ref={dateInputRef}
                  name="date"
                  type="date"
                  value={formValues.date}
                  onChange={handleFieldChange}
                  aria-label="Travel date"
                />
                <button
                  type="button"
                  className="intro-date-input__trigger"
                  onClick={handleDatePickerOpen}
                  aria-label="Open date picker"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.25A2.75 2.75 0 0 1 22 6.75v12.5A2.75 2.75 0 0 1 19.25 22H4.75A2.75 2.75 0 0 1 2 19.25V6.75A2.75 2.75 0 0 1 4.75 4H6V3a1 1 0 0 1 1-1Zm13 8H4v9.25c0 .414.336.75.75.75h14.5a.75.75 0 0 0 .75-.75V10ZM6 6H4.75a.75.75 0 0 0-.75.75V8h16V6.75a.75.75 0 0 0-.75-.75H18v1a1 1 0 1 1-2 0V6H8v1a1 1 0 1 1-2 0V6Zm1.5 6.25h2.25a.75.75 0 0 1 0 1.5H7.5a.75.75 0 0 1 0-1.5Zm0 3.5h2.25a.75.75 0 0 1 0 1.5H7.5a.75.75 0 0 1 0-1.5Zm6.75-3.5h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1 0-1.5Zm0 3.5h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1 0-1.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </label>
          </div>

          <div className="intro-form__actions">
            <button
              type="button"
              className="intro-secondary-button"
              onClick={() => onNavigateScreen && onNavigateScreen("history")}
            >
              Recent Searches
            </button>

            <button
              type="button"
              className="intro-primary-button"
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>

          {recentSearches.length > 0 ? (
            <div className="intro-advanced">
              <h3 className="intro-advanced__title">Recent Searches</h3>
              <div className="intro-recent-searches">
                {recentSearches.slice(0, 4).map((search) => (
                  <button
                    key={
                      search.id ??
                      `${search.origin}-${search.destination}-${search.travelDate}-${search.searchedAt}`
                    }
                    type="button"
                    className="intro-recent-searches__item"
                    onClick={() => handleRecentSearchClick(search)}
                  >
                    {search.origin} to {search.destination}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="intro-advanced">
            <h3 className="intro-advanced__title">
              <button
                type="button"
                className="intro-advanced__toggle"
                aria-expanded={isAdvancedOpen}
                aria-controls="advanced-options-panel"
                onClick={() =>
                  setIsAdvancedOpen((currentValue) => !currentValue)
                }
              >
                <span>Advanced Options</span>
                <svg
                  className="intro-advanced__toggle-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M6.47 8.97a.75.75 0 0 1 1.06 0L12 13.44l4.47-4.47a.75.75 0 1 1 1.06 1.06l-5 5a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 0 1 0-1.06Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </h3>

            {isAdvancedOpen ? (
              <div id="advanced-options-panel" className="intro-advanced__grid">
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
                  <select
                    name="travelers"
                    value={formValues.travelers}
                    onChange={handleFieldChange}
                  >
                    {TRAVELER_OPTIONS.map((option) => (
                      <option
                        key={option.value || "placeholder"}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

export default IntroPage;
