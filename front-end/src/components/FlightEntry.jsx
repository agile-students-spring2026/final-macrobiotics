import React, { useState, useEffect } from "react";
import "./FlightEntry.css";

const FlightEntry = ({
  departureTime,
  departureAirport,
  arrivalTime,
  arrivalAirport,
  duration,
  flightNumber,
  miles,
  logoUrl,
}) => {
  return (
    <div className="ticket-container">
      <div className="ticket-top-row">
        {/* Departure */}
        <div className="flight-info">
          <span className="time">{departureTime}</span>
          <span className="airport">{departureAirport}</span>
        </div>

        {/* Flight Duration */}
        <div className="duration-container">
          <span className="duration-text">{duration}</span>
          <div className="arrow-line-container">
            <div className="arrow-line"></div>
            <div className="arrow-head">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* Arrival */}
        <div className="flight-info">
          <span className="airport">{arrivalAirport}</span>
          <span className="time">{arrivalTime}</span>
        </div>
      </div>

      {/* Logo, Flight Number, Miles*/}
      <div className="ticket-bottom-row">
        <div className="airline-info">
          <div className="logo-placeholder">
            <img src={logoUrl} alt="Airline Logo" className="airline-logo" />
          </div>
          <span className="flight-number">{flightNumber}</span>
        </div>

        <div className="miles-container">
          <span className="miles-cost">{miles} Miles</span>
        </div>
      </div>
    </div>
  );
};

export default FlightEntry;
