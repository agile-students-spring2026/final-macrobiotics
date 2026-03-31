import { useEffect, useMemo, useState } from "react";
import FlightEntry from "../components/FlightEntry";

function SearchResultsPage({onSelectFlight}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [airFilter, setAirFilter] = useState([]);
  const [stopsFilter, setStopsFilter] = useState([]);
  const [sortBy, setSortBy] = useState("miles");
  const toggleFilter = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

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
    if (airFilter.length) f = f.filter(x => airFilter.includes(x.airline));
    if (stopsFilter.includes("Nonstop")) f = f.filter(x => x.stops === 0);
    if (stopsFilter.includes("1 Stop")) f = f.filter(x => x.stops === 1);
    if (stopsFilter.includes("2+ Stops")) f = f.filter(x => x.stops >= 2);
    return [...f].sort((a, b) => sortBy === "miles" ? a.miles - b.miles : a.durationMin - b.durationMin);
  }, [airFilter, flights, sortBy, stopsFilter]);

  return (
    <section className="screen">
      <h2>Search Results Screen</h2>
      <p>Placeholder for search filters, sort controls, and results list.</p>
      <div className="placeholder-grid">
        <div className="search-update-form">
          <input placeholder="From" value={from} onChange={e => setFrom(e.target.value)} />
          <input placeholder="To" value={to} onChange={e => setTo(e.target.value)} />
          <input placeholder="Date" value={date} onChange={e => setDate(e.target.value)} />
          <button>Update</button>
        </div>

        <div className="sort-filter">
          <p>Airlines</p>
          {airlineOptions.map(a => (
            <label key={a}>
              <input type="checkbox" checked={airFilter.includes(a)} onChange={() => toggleFilter(airFilter, setAirFilter, a)}/> {a}
            </label>
          ))}
          <p>Stops</p>
          {["Nonstop", "1 Stop", "2+ Stops"].map(s => (
            <label key={s}>
              <input type="checkbox" checked={stopsFilter.includes(s)} onChange={() => toggleFilter(stopsFilter, setStopsFilter, s)}/> {s}
            </label>
          ))}
          <p>Sort by</p>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="miles">Miles</option>
            <option value="duration">Duration</option>
          </select>
        </div>
        <div className="results-list">
          {isLoading ? <p>Loading search results...</p> : null}
          {!isLoading && loadError ? <p>{loadError}</p> : null}
          {!isLoading && !loadError ? filtered.map(flight => (
            <div key={flight.id} onClick={() => onSelectFlight(flight)}>
              <FlightEntry
                key={flight.id}
                departureTime={flight.dep}
                departureAirport={flight.depAirport}
                arrivalTime={flight.arr}
                arrivalAirport={flight.arrAirport}
                duration={`${Math.floor(flight.durationMin / 60)}h ${flight.durationMin % 60}m`}
                flightNumber={flight.flightNo}
                miles={flight.miles.toLocaleString()}
                logoUrl={flight.logoUrl || ""}
                onClick={() => onSelectFlight(flight)}
              />
            </div>
          )) : null}
          {!isLoading && !loadError && filtered.length === 0 ? <p>No flights match the current filters.</p> : null}
        </div>
      </div>
    </section>
  );
}
export default SearchResultsPage;
