const RECENT_SEARCHES_STORAGE_KEY = "milely-recent-searches";
const MAX_RECENT_SEARCHES = 8;

function toIsoDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeRecentSearch(search) {
  return {
    id: search.id,
    origin: (search.origin || "").trim().toUpperCase(),
    destination: (search.destination || "").trim().toUpperCase(),
    travelDate: toIsoDate(search.travelDate),
    tripType: search.tripType || "One-way",
    cabin: search.cabin || "Any Cabin",
    preferredAirline: search.preferredAirline || "Any Airline",
    travelers: Number(search.travelers) || 1,
    milesRange: search.milesRange || "Any",
    searchedAt: toIsoDate(search.searchedAt) || toIsoDate(new Date()),
  };
}

export function loadRecentSearches() {
  try {
    const storedValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map((search) => normalizeRecentSearch(search));
  } catch {
    return [];
  }
}

export function saveRecentSearch(search) {
  const normalizedSearch = normalizeRecentSearch({
    ...search,
    id:
      search.id ||
      `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    searchedAt: toIsoDate(new Date()),
  });

  const dedupeKey = [
    normalizedSearch.origin,
    normalizedSearch.destination,
    normalizedSearch.travelDate,
    normalizedSearch.cabin,
    normalizedSearch.preferredAirline,
    normalizedSearch.travelers,
    normalizedSearch.milesRange,
  ].join("|");

  const nextSearches = [
    normalizedSearch,
    ...loadRecentSearches().filter((existingSearch) => {
      const existingKey = [
        existingSearch.origin,
        existingSearch.destination,
        existingSearch.travelDate,
        existingSearch.cabin,
        existingSearch.preferredAirline,
        existingSearch.travelers,
        existingSearch.milesRange,
      ].join("|");

      return existingKey !== dedupeKey;
    }),
  ].slice(0, MAX_RECENT_SEARCHES);

  window.localStorage.setItem(
    RECENT_SEARCHES_STORAGE_KEY,
    JSON.stringify(nextSearches),
  );

  return nextSearches;
}
