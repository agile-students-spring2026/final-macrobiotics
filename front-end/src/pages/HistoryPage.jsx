import { useEffect, useMemo, useState } from "react";

function HistoryPage({ onNavigateScreen }) {
  const [filters, setFilters] = useState({
    airline: "",
    destination: "",
    date: ""
  });
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/mock/recently-viewed-flights.json");

        if (!response.ok) {
          throw new Error("Unable to load recently viewed flights.");
        }

        const historyFlights = await response.json();

        if (isMounted) {
          setFlights(historyFlights);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setFlights([]);
          setLoadError("Unable to load recently viewed flights.");
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

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const airlineMatches = flight.airline
        .toLowerCase()
        .includes(filters.airline.trim().toLowerCase());
      const destinationMatches = flight.arrivalAirport
        .toLowerCase()
        .includes(filters.destination.trim().toLowerCase());
      const dateMatches = !filters.date || flight.viewedDate === filters.date;

      return airlineMatches && destinationMatches && dateMatches;
    });
  }, [filters, flights]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  }

  function handleBackClick() {
    if (onNavigateScreen) {
      onNavigateScreen("search-results");
    }
  }

  return (
    <section className="screen history-screen">
      <div className="history-panel">
        <button
          type="button"
          className="history-back-button"
          onClick={handleBackClick}
        >
          Back
        </button>

        <header className="history-heading">
          <p className="history-heading__eyebrow">History</p>
          <h2 className="history-heading__title">Recently Viewed</h2>
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
            <div className="history-empty-state">Loading recently viewed flights...</div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="history-empty-state">{loadError}</div>
          ) : null}

          {!isLoading && !loadError
            ? filteredFlights.map((flight) => (
                <article key={flight.id} className="history-card">
                  <div className="history-card__summary">
                    <div className="history-card__terminal">
                      <span className="history-card__time">
                        {flight.departureTime}
                      </span>
                      <span className="history-card__airport">
                        {flight.departureAirport}
                      </span>
                    </div>

                    <div className="history-card__route">
                      <span className="history-card__duration">{flight.duration}</span>
                      <div className="history-card__line" aria-hidden="true">
                        <span className="history-card__line-fill" />
                        <span className="history-card__line-arrow">&rarr;</span>
                      </div>
                      <span className="history-card__stop">{flight.stopLabel}</span>
                    </div>

                    <div className="history-card__terminal history-card__terminal--arrival">
                      <span className="history-card__airport">
                        {flight.arrivalAirport}
                      </span>
                      <span className="history-card__time">{flight.arrivalTime}</span>
                    </div>
                  </div>

                  <div className="history-card__meta">
                    <div className="history-card__airline">
                      <span className="history-card__badge">{flight.airline}</span>
                      <div className="history-card__numbers">
                        {flight.flightNumbers.map((flightNumber) => (
                          <span key={flightNumber}>{flightNumber}</span>
                        ))}
                      </div>
                    </div>

                    <div className="history-card__miles">{flight.miles} Miles</div>
                  </div>
                </article>
              ))
            : null}

          {!isLoading && !loadError && filteredFlights.length === 0 ? (
            <div className="history-empty-state">
              No recently viewed flights match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default HistoryPage;
