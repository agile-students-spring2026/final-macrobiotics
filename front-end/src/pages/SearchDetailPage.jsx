import { apiClient } from "../api/apiClient";
import ScreenQuickActions from "../components/ScreenQuickActions";

function formatDuration(durationValue) {
  if (!durationValue) {
    return "";
  }

  return durationValue.replace(/\s+/g, "");
}

function formatDurationFromMinutes(minutes) {
  if (!Number.isFinite(minutes)) {
    return "";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

function getStopSummary(flight) {
  if (!flight?.stops) {
    return "Nonstop";
  }

  return `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`;
}

function getViaLabel(flight) {
  if (Array.isArray(flight?.connections) && flight.connections.length > 0) {
    return `Via ${flight.connections[0]}`;
  }

  if (!flight?.stops || !flight?.itinerary?.length) {
    return "Direct routing";
  }

  const firstStop = flight.itinerary[0]?.arrA;
  return firstStop ? `Via ${firstStop}` : "Connecting itinerary";
}

function getBookingProgramLabel(flight) {
  const programLabel = flight?.source || flight?.seatAeroSource;

  if (!programLabel) {
    return flight?.airline || "carrier";
  }

  return programLabel
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function RouteBlock({
  departureTime,
  departureAirport,
  arrivalTime,
  arrivalAirport,
  duration,
  metaLabel,
  footLabel,
}) {
  return (
    <div className="search-detail-route-block">
      <div className="search-detail-route-block__times">
        <span className="search-detail-time">{departureTime}</span>
        <span className="search-detail-route-duration">{duration}</span>
        <span className="search-detail-time search-detail-time--arrival">
          {arrivalTime}
        </span>
      </div>

      <div className="search-detail-route-block__airports">
        <span className="search-detail-airport">{departureAirport}</span>
        <div className="search-detail-route-arrow" aria-hidden="true">
          <span className="search-detail-route-arrow-line" />
          <span className="search-detail-route-arrow-head">{">"}</span>
        </div>
        <span className="search-detail-airport search-detail-airport--arrival">
          {arrivalAirport}
        </span>
      </div>

      <div className="search-detail-route-block__meta">
        <span className="search-detail-route-stop">{metaLabel}</span>
        {footLabel ? (
          <span className="search-detail-flight-number">{footLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

function SearchDetailPage({
  activeScreen,
  flight,
  onGoBack,
  onNavigateScreen,
}) {
  const itinerary =
    flight?.itinerary?.length > 0
      ? flight.itinerary
      : flight
        ? [
            {
              depA: flight.depAirport,
              dep: flight.dep,
              arrA: flight.arrAirport,
              arr: flight.arr,
              dur: formatDurationFromMinutes(flight.durationMin),
            },
          ]
        : [];

  function handleBackClick() {
    if (onGoBack) {
      onGoBack("search-results");
    }
  }

  async function handleBookmark() {
    try {
      const response = await apiClient("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify(flight),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error occurred.");
      } else {
        //TODO: Change to toast notification?
        alert("Bookmark saved!");
      }
    } catch (error) {
      alert("Unable to save bookmark. Reason: " + error.message);
    }
  }

  if (!flight) {
    return (
      <section className="screen search-detail-screen">
        <div className="search-detail-panel">
          <div className="history-empty-state">No flight selected.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen search-detail-screen">
      <div className="search-detail-panel">
        <div className="search-detail-topbar">
          <button
            type="button"
            className="search-detail-back-button"
            onClick={handleBackClick}
          >
            Back
          </button>

          <ScreenQuickActions
            activeScreen={activeScreen}
            onNavigateScreen={onNavigateScreen}
          />
        </div>

        <header className="search-detail-header">
          <p className="search-detail-header__eyebrow">Flight Details</p>
          <h2 className="search-detail-header__title">
            {flight.depAirport} to {flight.arrAirport}
          </h2>
          <p className="search-detail-header__copy">
            Review the itinerary, stop pattern, and mileage cost before booking.
          </p>
        </header>

        <section className="search-detail-hero">
          <RouteBlock
            departureTime={flight.dep}
            departureAirport={flight.depAirport}
            arrivalTime={flight.arr}
            arrivalAirport={flight.arrAirport}
            duration={formatDurationFromMinutes(flight.durationMin)}
            metaLabel={getViaLabel(flight)}
          />

          <div className="search-detail-meta">
            {flight.class ? (
              <span className="history-card__chip">{flight.class}</span>
            ) : null}
            {flight.airline ? (
              <span className="history-card__chip">{flight.airline}</span>
            ) : null}
            {flight.source || flight.seatAeroSource ? (
              <span className="history-card__chip">
                {getBookingProgramLabel(flight)}
              </span>
            ) : null}
            {flight.flightNo ? (
              <span className="history-card__chip">{flight.flightNo}</span>
            ) : null}
            <span className="history-card__chip">{getStopSummary(flight)}</span>
          </div>
        </section>

        <section className="search-detail-itinerary">
          <div className="search-detail-section-heading">
            <h3 className="search-detail-section-heading__title">Itinerary</h3>
            <p className="search-detail-section-heading__copy">
              Segment-by-segment routing for this award option.
            </p>
          </div>

          <div className="search-detail-segments">
            {itinerary.map((segment, index) => (
              <div key={`${segment.depA}-${segment.arrA}-${index}`}>
                <article className="search-detail-segment">
                  <div className="search-detail-segment__badge">
                    Segment {index + 1}
                  </div>

                  <RouteBlock
                    departureTime={segment.dep}
                    departureAirport={segment.depA}
                    arrivalTime={segment.arr}
                    arrivalAirport={segment.arrA}
                    duration={formatDuration(segment.dur)}
                    metaLabel={index === 0 ? "Operating segment" : "Connection"}
                    footLabel={flight.flightNo}
                  />
                </article>

                {segment.layover ? (
                  <p className="search-detail-layover">
                    Layover: {segment.layover}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="search-detail-actions">
          <div className="search-detail-actions__summary">
            <span className="search-detail-actions__label">
              Total Award Cost
            </span>
            <p className="search-detail-total">
              {flight.miles.toLocaleString()} Miles
            </p>
          </div>

          <div className="search-detail-actions__row">
            <button
              type="button"
              className="search-detail-bookmark-button"
              onClick={handleBookmark}
            >
              Save to Bookmarks
            </button>
            <button
              type="button"
              className="search-detail-book-button"
              onClick={() =>
                alert(`Booking via ${getBookingProgramLabel(flight)}`)
              }
            >
              Book via {getBookingProgramLabel(flight)}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

export default SearchDetailPage;
