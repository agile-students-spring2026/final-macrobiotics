function SearchDetailPage({ flight, onBack }) {
  function handleBackClick() {
    if (onNavigateScreen) {
      onNavigateScreen("search-results");
    }
  }

  if (!flight) return <p>No flight selected.</p>;

  return (
    <section className="screen">
      <button onClick={handleBackClick}> Back </button>
      <h2>Search Result Detail Screen</h2>
      <p>Placeholder for itinerary breakdown and booking action.</p>
      <div className="placeholder-grid">
        <div className="Flight Header">
          <h3>{flight.flightNo}</h3>
          <p>
            {flight.depAirport} - {flight.arrAirport}
          </p>
          <p>
            {flight.dep} - {flight.arr}
          </p>
          <p>
            {flight.class} . {flight.airline}
          </p>
        </div>

        <div className="Itinerary Timeline">
          {flight.itinerary.map((seg, i) => (
            <div key={i}>
              <p>
                {seg.depA} {seg.dep} - {seg.arrA} {seg.arr} ({seg.dur})
              </p>
              {seg.layover && <p>Layover: {seg.layover}</p>}
            </div>
          ))}
        </div>

        <div className="Book Flight Action">
          <p>Total: {flight.miles.toLocaleString()} miles</p>
          <button onClick={() => alert("Booking via ${flight.airline}")}>
            Book Via {flight.airline}
          </button>
        </div>
      </div>
    </section>
  );
}

export default SearchDetailPage;
