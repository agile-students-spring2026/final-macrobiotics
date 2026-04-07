import { useEffect, useMemo, useState } from "react";
import FlightEntry from "../components/FlightEntry";
import ScreenQuickActions from "../components/ScreenQuickActions";

function SearchResultsPage({
  activeScreen,
  onGoBack,
  onNavigateScreen,
  onSelectFlight,
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [airFilter, setAirFilter] = useState([]);
  const [stopsFilter, setStopsFilter] = useState([]);
  const [sortBy, setSortBy] = useState("miles");

  const toggleFilter = (arr, setArr, val) =>
    setArr(
      arr.includes(val) ? arr.filter((item) => item !== val) : [...arr, val],
    );

  useEffect(() => {
    let isMounted = true;

    async function loadFlights() {
      try {
        const response = await fetch("/mock/search-results.json");

        if (!response.ok) {
          throw new Error("Unable to load search results.");
        }

        const searchResults = await response.json();

        if (isMounted) {
          setFlights(searchResults);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setFlights([]);
          setLoadError("Unable to load search results.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFlights();

    return () => {
      isMounted = false;
    };
  }, []);

  const airlineOptions = useMemo(() => {
    return [...new Set(flights.map((flight) => flight.airline))];
  }, [flights]);

  const filtered = useMemo(() => {
    let f = flights;
    if (airFilter.length)
      f = f.filter((flight) => airFilter.includes(flight.airline));
    if (stopsFilter.includes("Nonstop"))
      f = f.filter((flight) => flight.stops === 0);
    if (stopsFilter.includes("1 Stop"))
      f = f.filter((flight) => flight.stops === 1);
    if (stopsFilter.includes("2+ Stops"))
      f = f.filter((flight) => flight.stops >= 2);

    return [...f].sort((a, b) =>
      sortBy === "miles" ? a.miles - b.miles : a.durationMin - b.durationMin,
    );
  }, [airFilter, flights, sortBy, stopsFilter]);

  return (
    <section className="screen search-results-screen">
      <div className="search-results-panel">
        <div className="panel-utility-row panel-utility-row--split">
          <button
            type="button"
            className="history-back-button"
            onClick={() => onGoBack && onGoBack("intro")}
          >
            Back
          </button>

          <ScreenQuickActions
            activeScreen={activeScreen}
            onNavigateScreen={onNavigateScreen}
          />
        </div>

        <header className="search-results-heading">
          <p className="search-results-heading__eyebrow">
            Award travel options
          </p>
          <h2 className="search-results-heading__title">Search Results</h2>
          <p className="search-results-heading__copy">
            Refine by route, airline, and stop count to compare available
            mileage options.
          </p>
        </header>

        <form
          className="search-results-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="search-results-form__grid">
            <label className="intro-field">
              <span>From</span>
              <input
                type="text"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                placeholder="Departure airport"
              />
            </label>

            <label className="intro-field">
              <span>To</span>
              <input
                type="text"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="Arrival airport"
              />
            </label>

            <label className="intro-field">
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <div className="intro-field search-results-form__action">
              <span
                className="search-results-form__action-label"
                aria-hidden="true"
              >
                Search
              </span>
              <button type="submit" className="intro-primary-button">
                Update
              </button>
            </div>
          </div>

          <div className="search-results-advanced">
            <h3 className="search-results-advanced__title">
              <button
                type="button"
                className="intro-advanced__toggle"
                aria-expanded={isAdvancedOpen}
                aria-controls="search-results-filters-panel"
                onClick={() =>
                  setIsAdvancedOpen((currentValue) => !currentValue)
                }
              >
                <span>Filters and Sort</span>
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
              <div
                id="search-results-filters-panel"
                className="search-results-filters"
              >
                <section className="search-results-filter-card">
                  <h3 className="search-results-filter-card__title">
                    Airlines
                  </h3>
                  <div className="search-results-option-list">
                    {airlineOptions.map((airline) => (
                      <label key={airline} className="search-results-option">
                        <input
                          type="checkbox"
                          checked={airFilter.includes(airline)}
                          onChange={() =>
                            toggleFilter(airFilter, setAirFilter, airline)
                          }
                        />
                        <span>{airline}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="search-results-filter-card">
                  <h3 className="search-results-filter-card__title">Stops</h3>
                  <div className="search-results-option-list">
                    {["Nonstop", "1 Stop", "2+ Stops"].map((stopsOption) => (
                      <label
                        key={stopsOption}
                        className="search-results-option"
                      >
                        <input
                          type="checkbox"
                          checked={stopsFilter.includes(stopsOption)}
                          onChange={() =>
                            toggleFilter(
                              stopsFilter,
                              setStopsFilter,
                              stopsOption,
                            )
                          }
                        />
                        <span>{stopsOption}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="search-results-filter-card search-results-filter-card--sort">
                  <label className="intro-field">
                    <span>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <option value="miles">Miles</option>
                      <option value="duration">Duration</option>
                    </select>
                  </label>
                </section>
              </div>
            ) : null}
          </div>
        </form>

        <div className="search-results-list" aria-live="polite">
          {isLoading ? (
            <div className="history-empty-state">Loading search results...</div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="history-empty-state">{loadError}</div>
          ) : null}

          {!isLoading && !loadError
            ? filtered.map((flight) => (
                <div
                  key={flight.id}
                  className="search-results-list__item"
                  onClick={() => onSelectFlight(flight)}
                >
                  <FlightEntry
                    departureTime={flight.dep}
                    departureAirport={flight.depAirport}
                    arrivalTime={flight.arr}
                    arrivalAirport={flight.arrAirport}
                    duration={`${Math.floor(flight.durationMin / 60)}h ${flight.durationMin % 60}m`}
                    flightNumber={flight.flightNo}
                    miles={flight.miles.toLocaleString()}
                    logoUrl={flight.logoUrl || ""}
                  />
                </div>
              ))
            : null}

          {!isLoading && !loadError && filtered.length === 0 ? (
            <div className="history-empty-state">
              No flights match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default SearchResultsPage;
