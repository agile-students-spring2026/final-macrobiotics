import React, { useState, useEffect } from "react";
import FlightEntry from "../components/FlightEntry";

const BookmarksPage = () => {
  // const mockApiData = [
  //   {
  //     id: "1",
  //     departureTime: "06:30",
  //     departureAirport: "SFO",
  //     arrivalTime: "13:30",
  //     arrivalAirport: "JFK",
  //     duration: "12h30min",
  //     flightNumber: "DL1131",
  //     miles: "35000",
  //   },
  //   {
  //     id: "2",
  //     departureTime: "08:15",
  //     departureAirport: "LAX",
  //     arrivalTime: "16:45",
  //     arrivalAirport: "EWR",
  //     duration: "5h30min",
  //     flightNumber: "UA402",
  //     miles: "42000",
  //   },
  // ];

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setError(null);
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "X-API-Key": import.meta.env.VITE_API_KEY,
          },
        });
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const data = await response.json();
        setFlights(data);
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
    <section className="screen">
      <h2>Your Saved Flights</h2>
      <div className="bookmarks-results-container">
        {flights?.map((flight) => (
          <FlightEntry key={flight.id} {...flight} />
        ))}

        {flights?.length === 0 && <p>Loading flights...</p>}
      </div>
    </section>
  );
};

export default BookmarksPage;
