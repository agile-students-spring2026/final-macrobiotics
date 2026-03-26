import { useMemo, useState } from "react";

const RECENTLY_VIEWED_FLIGHTS = [
  {
    id: "history-1",
    airline: "Delta",
    departureTime: "06:30",
    departureAirport: "SFO",
    arrivalTime: "13:30",
    arrivalAirport: "JFK",
    duration: "12h 30m",
    stopLabel: "Nonstop",
    flightNumbers: ["DL1131"],
    miles: "35,000",
    viewedDate: "2026-03-18"
  },
  {
    id: "history-2",
    airline: "Delta",
    departureTime: "06:30",
    departureAirport: "SFO",
    arrivalTime: "15:30",
    arrivalAirport: "JFK",
    duration: "14h 30m",
    stopLabel: "Via IAD",
    flightNumbers: ["DL1131", "DL1135"],
    miles: "35,000",
    viewedDate: "2026-03-21"
  }
];

function HistoryPage({ onNavigateScreen }) {
  const [filters, setFilters] = useState({
    airline: "",
    destination: "",
    date: ""
  });

  const filteredFlights = useMemo(() => {
    return RECENTLY_VIEWED_FLIGHTS.filter((flight) => {
      const airlineMatches = flight.airline
        .toLowerCase()
        .includes(filters.airline.trim().toLowerCase());
      const destinationMatches = flight.arrivalAirport
        .toLowerCase()
        .includes(filters.destination.trim().toLowerCase());
      const dateMatches = !filters.date || flight.viewedDate === filters.date;

      return airlineMatches && destinationMatches && dateMatches;
    });
  }, [filters]);

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
          {filteredFlights.map((flight) => (
            <article key={flight.id} className="history-card">
              <div className="history-card__summary">
                <div className="history-card__terminal">
                  <span className="history-card__time">{flight.departureTime}</span>
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
          ))}

          {filteredFlights.length === 0 ? (
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
