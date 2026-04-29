import { useMemo, useState } from "react";
import AppFrame from "./components/AppFrame";
import { hasAuthToken } from "./api/authToken";
import { apiClient } from "./api/apiClient";
import { saveRecentSearch } from "./utils/recentSearches";
import BookmarksPage from "./pages/BookmarksPage";
import HistoryPage from "./pages/HistoryPage";
import IntroPage from "./pages/IntroPage";
import LoginPage from "./pages/LoginPage";
import SearchDetailPage from "./pages/SearchDetailPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SettingsPage from "./pages/SettingsPage";

const BASE_SCREENS = [
  { id: "intro", label: "Intro" },
  { id: "search-results", label: "Search Results" },
  { id: "search-detail", label: "Search Detail" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "history", label: "History" },
];

const SCREEN_COMPONENTS = {
  intro: IntroPage,
  login: LoginPage,
  "search-results": SearchResultsPage,
  "search-detail": SearchDetailPage,
  bookmarks: BookmarksPage,
  settings: SettingsPage,
  history: HistoryPage,
};

function App() {
  const [activeScreen, setActiveScreen] = useState("intro");
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchFlights, setSearchFlights] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchLoadError, setSearchLoadError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFormValues, setSearchFormValues] = useState({
    from: "",
    to: "",
    date: "",
  });
  const isAuthenticated = hasAuthToken();

  const screens = useMemo(() => {
    const accountScreen = isAuthenticated
      ? { id: "settings", label: "Settings" }
      : { id: "login", label: "Login" };

    return [BASE_SCREENS[0], accountScreen, ...BASE_SCREENS.slice(1)];
  }, [isAuthenticated]);

  const ActiveScreen = useMemo(
    () => SCREEN_COMPONENTS[activeScreen] ?? IntroPage,
    [activeScreen],
  );

  function handleNavigateScreen(nextScreen) {
    const resolvedScreen =
      nextScreen === "login" && isAuthenticated ? "settings" : nextScreen;

    if (resolvedScreen === "settings" && !isAuthenticated) {
      setNavigationHistory((currentHistory) => [
        ...currentHistory,
        activeScreen,
      ]);
      setActiveScreen("login");
      return;
    }

    if (!resolvedScreen || resolvedScreen === activeScreen) {
      return;
    }

    setNavigationHistory((currentHistory) => [...currentHistory, activeScreen]);
    setActiveScreen(resolvedScreen);
  }

  function handleGoBack(fallbackScreen = "intro") {
    if (navigationHistory.length > 0) {
      const previousScreen = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((currentHistory) => currentHistory.slice(0, -1));
      setActiveScreen(previousScreen);
      return;
    }

    if (fallbackScreen && fallbackScreen !== activeScreen) {
      setActiveScreen(fallbackScreen);
    }
  }

  const handleSelectFlight = (flightData) => {
    setSelectedFlight(flightData);
    handleNavigateScreen("search-detail");
  };

  async function handleStartSearch(criteria) {
    const normalizedFrom = (criteria.from ?? "").trim().toUpperCase();
    const normalizedTo = (criteria.to ?? "").trim().toUpperCase();
    const date = criteria.date ?? "";
    const nextSearchContext = {
      classType: criteria.classType ?? "",
      airlines: criteria.airlines ?? "",
      miles: criteria.miles ?? "",
      travelers: criteria.travelers ?? "1",
    };

    setSearchFormValues({ from: normalizedFrom, to: normalizedTo, date });
    setSelectedFlight(null);

    if (activeScreen !== "search-results") {
      handleNavigateScreen("search-results");
    }

    if (!normalizedFrom || !normalizedTo || !date) {
      setSearchFlights([]);
      setHasSearched(false);
      setSearchLoadError("Origin, destination, and date are required.");
      return;
    }

    setIsSearchLoading(true);
    setHasSearched(true);
    setSearchLoadError("");

    try {
      const queryParams = new URLSearchParams({
        origin: normalizedFrom,
        destination: normalizedTo,
        date,
      });
      const response = await apiClient(
        `/api/search/flights?${queryParams.toString()}`,
      );
      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(
          responseJson.message || "Unable to load search results.",
        );
      }

      setSearchFlights(
        Array.isArray(responseJson.data) ? responseJson.data : [],
      );
      setSearchLoadError("");
      saveRecentSearch({
        origin: normalizedFrom,
        destination: normalizedTo,
        travelDate: date,
        tripType: "One-way",
        cabin: nextSearchContext.classType
          ? nextSearchContext.classType
              .split("-")
              .map(
                (segment) => segment.charAt(0).toUpperCase() + segment.slice(1),
              )
              .join(" ")
          : "Any Cabin",
        preferredAirline: nextSearchContext.airlines || "Any Airline",
        travelers: nextSearchContext.travelers || 1,
        milesRange: nextSearchContext.miles || "Any",
      });
    } catch (error) {
      setSearchFlights([]);
      setSearchLoadError(error.message || "Unable to load search results.");
    } finally {
      setIsSearchLoading(false);
    }
  }

  return (
    <AppFrame
      screens={screens}
      activeScreen={activeScreen}
      onChangeScreen={handleNavigateScreen}
    >
      <ActiveScreen
        activeScreen={activeScreen}
        isAuthenticated={isAuthenticated}
        onNavigateScreen={handleNavigateScreen}
        onGoBack={handleGoBack}
        onSelectFlight={handleSelectFlight}
        onStartSearch={handleStartSearch}
        flights={searchFlights}
        isLoading={isSearchLoading}
        loadError={searchLoadError}
        hasSearched={hasSearched}
        searchFormValues={searchFormValues}
        flight={selectedFlight}
      />
    </AppFrame>
  );
}

export default App;
