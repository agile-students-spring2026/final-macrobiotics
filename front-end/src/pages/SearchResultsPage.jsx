import { useState, useMemo } from "react";
import FlightEntry from "../components/FlightEntry";

const MOCK_FLIGHTS = [
  {
    id: 1,
    airline: "Delta",
    flightNo: "DL1131",
    depAirport: "SFO",
    arrAirport: "JFK",
    dep: "06:30",
    arr: "09:30",
    durationMin: 330,
    stops: 0,
    miles: 36000,
    logoUrl: "",
    itinerary: [
      { depA: "SFO", dep: "06:30", arrA: "JFK", arr: "09:30", dur: "5h30min" },
    ],
  },
  {
    id: 2,
    airline: "United",
    flightNo: "UA823",
    depAirport: "SFO",
    arrAirport: "JFK",
    dep: "08:00",
    arr: "16:45",
    durationMin: 525,
    stops: 1,
    miles: 28000,
    logoUrl: "",
    itinerary: [
      { depA: "SFO", dep: "08:00", arrA: "ORD", arr: "11:30", dur: "3h30min", layover: "2h15min" },
      { depA: "ORD", dep: "13:45", arrA: "JFK", arr: "16:45", dur: "2h0min" },
    ],
  },
  {
    id: 3,
    airline: "American",
    flightNo: "AA301",
    depAirport: "SFO",
    arrAirport: "JFK",
    dep: "09:15",
    arr: "17:50",
    durationMin: 515,
    stops: 0,
    miles: 42000,
    logoUrl: "",
    itinerary: [
      { depA: "SFO", dep: "09:15", arrA: "JFK", arr: "17:50", dur: "8h35min" },
    ],
  },
]

function SearchResultsPage({ onSelectFlight }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [airFilter, setAirFilter] = useState([]);
  const [stopsFilter, setStopsFilter] = useState([]);
  const [sortBy, setSortBy] = useState("miles");
  const toggleFilter = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const filtered = useMemo(() => {
    let f = MOCK_FLIGHTS;
    if (airFilter.length) f = f.filter((x) => airFilter.includes(x.airline));
    if (stopsFilter.includes("Nonstop")) f = f.filter((x) => x.stops === 0);
    if (stopsFilter.includes("1 Stop")) f = f.filter((x) => x.stops === 1);
    return [...f].sort((a, b) =>
      sortBy === "miles" ? a.miles - b.miles : a.durationMin - b.durationMin,
    );
  });
  return (
    <section className="screen">
      <h2>Search Results Screen</h2>
      <p>Placeholder for search filters, sort controls, and results list.</p>
      <div className="placeholder-grid">
        <div className="search-update-form">
          <input
            placeholder="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            placeholder="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button>Update</button>
        </div>

        <div className="sort-filter">
          <p>Airlines</p>
          {["Delta", "United", "American"].map((a) => (
            <label key={a}>
              <input
                type="checkbox"
                checked={airFilter.includes(a)}
                onChange={() => toggleFilter(airFilter, setAirFilter, a)}
              />{" "}
              {a}
            </label>
          ))}
          <p>Stops</p>
          {["Nonstop", "1 Stop", "2+ Stops"].map((s) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={stopsFilter.includes(s)}
                onChange={() => toggleFilter(stopsFilter, setStopsFilter, s)}
              />{" "}
              {s}
            </label>
          ))}
          <p>Sort by</p>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="miles">Miles</option>
            <option value="duration">Duration</option>
          </select>
        </div>
        <div className="results-list">
          {filtered.map((flight) => (
            <div key={flight.id} onClick={() => onSelectFlight(flight)}>
            <FlightEntry
                key={flight.id}
                departureTime={flight.dep}
                departureAirport={flight.depAirport}
                arrivalTime={flight.arr}
                arrivalAirport={flight.arrAirport}
                duration={`${Math.floor(flight.durationMin / 60)}h${flight.durationMin % 60}min`}
                flightNumber={flight.flightNo}
                miles={flight.miles.toLocaleString()}
                logoUrl={flight.logoUrl || ""}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export default SearchResultsPage;
