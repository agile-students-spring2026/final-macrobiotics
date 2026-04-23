import { useMemo, useState } from "react";
import AppFrame from "./components/AppFrame";
import { hasAuthToken } from "./api/authToken";
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
  const [searchRequest, setSearchRequest] = useState(null);
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
      setNavigationHistory((currentHistory) => [...currentHistory, activeScreen]);
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

  function handleStartSearch(searchCriteria) {
    setSearchRequest({
      requestId: Date.now(),
      ...searchCriteria,
    });
    setSelectedFlight(null);

    if (activeScreen !== "search-results") {
      handleNavigateScreen("search-results");
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
        searchRequest={searchRequest}
        flight={selectedFlight}
      />
    </AppFrame>
  );
}

export default App;
