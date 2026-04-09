import { useEffect, useState } from "react";
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

  if (hours === 0) {
    return `${remainder}m`;
  }

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

function getUniqueDelimitedValues(value) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return [...new Set(
    value
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean),
  )];
}

function formatUniqueDelimitedValue(value) {
  return getUniqueDelimitedValues(value).join(", ");
}

function normalizeChipValue(value) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/\bprogram\b/g, "")
    .replace(/\bairlines?\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function shouldShowBookingProgram(flight, airlineLabel, bookingProgramLabel) {
  if (!bookingProgramLabel) {
    return false;
  }

  const normalizedProgramLabel = normalizeChipValue(bookingProgramLabel);

  if (!normalizedProgramLabel) {
    return false;
  }

  return !getUniqueDelimitedValues(airlineLabel).some((airlineValue) => {
    const normalizedAirlineValue = normalizeChipValue(airlineValue);

    return (
      normalizedAirlineValue === normalizedProgramLabel ||
      normalizedAirlineValue.includes(normalizedProgramLabel) ||
      normalizedProgramLabel.includes(normalizedAirlineValue)
    );
  });
}

function buildMetaChips(flight) {
  const chips = [];
  const airlineLabel = formatUniqueDelimitedValue(flight?.airline);
  const bookingProgramLabel =
    flight?.source || flight?.seatAeroSource ? getBookingProgramLabel(flight) : "";
  const flightNumberLabel = formatUniqueDelimitedValue(flight?.flightNo);
  const orderedLabels = [
    flight?.class,
    airlineLabel,
    shouldShowBookingProgram(flight, airlineLabel, bookingProgramLabel)
      ? `Program: ${bookingProgramLabel}`
      : "",
    flightNumberLabel,
    getStopSummary(flight),
  ];

  orderedLabels.filter(Boolean).forEach((label) => {
      const normalizedLabel = normalizeChipValue(label);

      if (
        normalizedLabel &&
        chips.some(
          (existingLabel) => normalizeChipValue(existingLabel) === normalizedLabel,
        )
      ) {
        return;
      }

      chips.push(label);
    });

  return chips;
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
  const [detailedFlight, setDetailedFlight] = useState(flight);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    setDetailedFlight(flight);
    setDetailError("");
  }, [flight]);

  useEffect(() => {
    if (!flight?.seatAeroAvailabilityId || !flight?.seatAeroTripId) {
      return;
    }

    let isActive = true;

    async function loadTripDetails() {
      setIsLoadingDetails(true);
      setDetailError("");

      try {
        const response = await apiClient(
          `/api/search/flights/${flight.seatAeroAvailabilityId}/trips/${flight.seatAeroTripId}`,
        );
        const responseJson = await response.json();

        if (!response.ok) {
          throw new Error(
            responseJson.message || "Unable to load detailed flight information.",
          );
        }

        if (isActive) {
          setDetailedFlight({
            ...flight,
            ...responseJson.data,
          });
        }
      } catch (error) {
        if (isActive) {
          setDetailError(
            error.message || "Unable to load detailed flight information.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingDetails(false);
        }
      }
    }

    loadTripDetails();

    return () => {
      isActive = false;
    };
  }, [flight]);

  const activeFlight = detailedFlight ?? flight;
  const metaChips = buildMetaChips(activeFlight);
  const itinerary =
    activeFlight?.itinerary?.length > 0
      ? activeFlight.itinerary
      : activeFlight
        ? [
            {
              depA: activeFlight.depAirport,
              dep: activeFlight.dep,
              arrA: activeFlight.arrAirport,
              arr: activeFlight.arr,
              dur: formatDurationFromMinutes(activeFlight.durationMin),
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
        body: JSON.stringify(activeFlight),
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

  if (!activeFlight) {
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
            {activeFlight.depAirport} to {activeFlight.arrAirport}
          </h2>
          <p className="search-detail-header__copy">
            Review the itinerary, stop pattern, and mileage cost before booking.
          </p>
          {isLoadingDetails ? (
            <p className="search-detail-header__copy">
              Loading detailed itinerary...
            </p>
          ) : null}
          {!isLoadingDetails && detailError ? (
            <p className="search-detail-header__copy">{detailError}</p>
          ) : null}
        </header>

        <section className="search-detail-hero">
          <RouteBlock
            departureTime={activeFlight.dep}
            departureAirport={activeFlight.depAirport}
            arrivalTime={activeFlight.arr}
            arrivalAirport={activeFlight.arrAirport}
            duration={formatDurationFromMinutes(activeFlight.durationMin)}
            metaLabel={getViaLabel(activeFlight)}
          />

          <div className="search-detail-meta">
            {metaChips.map((chipLabel) => (
              <span key={chipLabel} className="history-card__chip">
                {chipLabel}
              </span>
            ))}
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
                    metaLabel="Flight segment"
                    footLabel={formatUniqueDelimitedValue(
                      segment.flightNo || activeFlight.flightNo,
                    )}
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
              {activeFlight.miles.toLocaleString()} Miles
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
              onClick={() => {
                const primaryBookingLink = activeFlight.bookingLinks?.find(
                  (bookingLink) => bookingLink.primary,
                );

                if (primaryBookingLink?.link) {
                  window.open(primaryBookingLink.link, "_blank", "noopener,noreferrer");
                  return;
                }

                alert(`Booking via ${getBookingProgramLabel(activeFlight)}`);
              }}
            >
              Book via {getBookingProgramLabel(activeFlight)}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

export default SearchDetailPage;
