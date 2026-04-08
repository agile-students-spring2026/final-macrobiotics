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

  const handleDeleteBookmark = async (flight) => {
    try {
      setError(null);

      const response = await apiClient(`/api/bookmarks/${flight.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bookmark.");
      }
      setFlights((prevFlights) =>
        prevFlights.filter((f) => f.id !== flight.id),
      );
    } catch (err) {
      setError(err.message);
      console.error("Failed to delete bookmark:", err);
    }
  };

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
            className="search-results-list__item flight-entry-container"
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
            <button
              className="delete-button"
              aria-label="Delete flight"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteBookmark(flight);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="trash-icon"
              >
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        ))}

        {flights.length === 0 && !loading && <p>No bookmarks found.</p>}
        {loading && <p>Loading flights...</p>}
      </div>
    </section>
  );
};

export default BookmarksPage;
