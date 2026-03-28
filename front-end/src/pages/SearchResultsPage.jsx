import { useState, useMemo } from "react";

function SearchResultsPage({onSelectFlight}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [airFilter, setAirFilter] = useState([]);
  const [stopsFilter, setStopsFilter] = useState([]);
  const [sortBy, setSortBy] = useState("miles");
  const toggleFilter = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
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
          {["Delta", "United", "American"].map(a => (
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
          {filtered.map(flight => (
            <div key={flight.id} onClick={() => onSelectFlight(flight)} className="flight-row">
              <span>{flight.flightNo}</span>
              <span>{flight.depAirport} &rarr {flight.arrAirport}</span>
              <span>{flight.dep} - {flight.arr}</span>
              <span>{flight.miles.toLocaleString()} miles</span>
            </div> 
          ))}
        </div>
      </div>
    </section>
  );
}

export default SearchResultsPage;
