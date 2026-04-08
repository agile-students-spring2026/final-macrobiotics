import React, { useState, useEffect } from "react";
import FlightEntry from "../components/FlightEntry";
import ScreenQuickActions from "../components/ScreenQuickActions";
import { apiClient } from "../api/apiClient";

const BookmarksPage = ({
  activeScreen,
  onGoBack,
  onNavigateScreen,
  onSelectFlight,
}) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await apiClient("/api/bookmarks", {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const responseJson = await response.json();
        setFlights(responseJson.data);
      } catch (err) {
        console.error("Failed to fetch flights:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  return (
    <section className="screen bookmarks-screen">
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

      <header className="bookmarks-header">
        <p className="bookmarks-header__eyebrow">Saved award options</p>
        <h2 className="bookmarks-header__title">Bookmarks</h2>
        <p className="bookmarks-header__copy">
          Keep your shortlisted flights here so they are easy to compare later.
        </p>
      </header>

      <div className="bookmarks-results-container">
        {flights?.map((flight) => (
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
        ))}

        {flights.length === 0 && !loading && <p>No bookmarks found.</p>}
        {loading && <p>Loading flights...</p>}
      </div>
    </section>
  );
};

export default BookmarksPage;
