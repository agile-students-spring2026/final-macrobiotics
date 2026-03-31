import { useEffect, useMemo, useState } from "react";
import ScreenQuickActions from "../components/ScreenQuickActions";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return DATE_FORMATTER.format(date);
}

function HistoryPage({ activeScreen, onNavigateScreen, onGoBack }) {
  const [filters, setFilters] = useState({
    airline: "",
    destination: "",
    date: ""
  });
  const [searches, setSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/mock/recent-searches.json");

        if (!response.ok) {
          throw new Error("Unable to load recent searches.");
        }

        const recentSearches = await response.json();

        if (isMounted) {
          setSearches(recentSearches);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setSearches([]);
          setLoadError("Unable to load recent searches.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSearches = useMemo(() => {
    return searches.filter((search) => {
      const airlineMatches = search.preferredAirline
        .toLowerCase()
        .includes(filters.airline.trim().toLowerCase());
      const destinationMatches = search.destination
        .toLowerCase()
        .includes(filters.destination.trim().toLowerCase());
      const dateMatches = !filters.date || search.travelDate === filters.date;

      return airlineMatches && destinationMatches && dateMatches;
    });
  }, [filters, searches]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  }

  function handleBackClick() {
    if (onGoBack) {
      onGoBack("intro");
    }
  }

  return (
    <section className="screen history-screen">
      <div className="history-panel">
        <div className="panel-utility-row panel-utility-row--split">
          <button
            type="button"
            className="history-back-button"
            onClick={handleBackClick}
          >
            Back
          </button>

          <ScreenQuickActions
            activeScreen={activeScreen}
            onNavigateScreen={onNavigateScreen}
          />
        </div>

        <header className="history-heading">
          <h2 className="history-heading__title">Recently Searched</h2>
        </header>

        <form
          className="history-filters"
          onSubmit={(event) => event.preventDefault()}
        >
          <h3 className="history-filters__title">Filter By</h3>

          <label className="history-filter-field">
            <span>Airline</span>
            <input
              name="airline"
              type="text"
              value={filters.airline}
              onChange={handleFilterChange}
              placeholder="Delta"
            />
          </label>

          <label className="history-filter-field">
            <span>Destination</span>
            <input
              name="destination"
              type="text"
              value={filters.destination}
              onChange={handleFilterChange}
              placeholder="JFK"
            />
          </label>

          <label className="history-filter-field">
            <span>Date</span>
            <input
              name="date"
              type="date"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </label>
        </form>

        <div className="history-results" aria-live="polite">
          {isLoading ? (
            <div className="history-empty-state">Loading recent searches...</div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="history-empty-state">{loadError}</div>
          ) : null}

          {!isLoading && !loadError
            ? filteredSearches.map((search) => (
                <article key={search.id} className="history-card history-card--search">
                  <div className="history-card__summary history-card__summary--search">
                    <div className="history-card__query">
                      <span className="history-card__query-label">
                        {search.tripType} search
                      </span>
                      <h3 className="history-card__query-route">
                        {search.origin} to {search.destination}
                      </h3>
                    </div>

                    <div className="history-card__query-date">
                      <span className="history-card__query-date-label">
                        Travel Date
                      </span>
                      <span className="history-card__query-date-value">
                        {formatDate(search.travelDate)}
                      </span>
                    </div>
                  </div>

                  <div className="history-card__meta history-card__meta--search">
                    <div className="history-card__chip-list">
                      <span className="history-card__chip">{search.cabin}</span>
                      <span className="history-card__chip">
                        Airline: {search.preferredAirline}
                      </span>
                      <span className="history-card__chip">
                        Travelers: {search.travelers}
                      </span>
                      <span className="history-card__chip">
                        Miles: {search.milesRange}
                      </span>
                    </div>

                    <span className="history-card__saved-at">
                      Saved {formatDate(search.searchedAt)}
                    </span>
                  </div>
                </article>
              ))
            : null}

          {!isLoading && !loadError && filteredSearches.length === 0 ? (
            <div className="history-empty-state">
              No saved searches match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default HistoryPage;
