import { useMemo, useState } from "react";
import AppFrame from "./components/AppFrame";
import BookmarksPage from "./pages/BookmarksPage";
import HistoryPage from "./pages/HistoryPage";
import IntroPage from "./pages/IntroPage";
import LoginPage from "./pages/LoginPage";
import SearchDetailPage from "./pages/SearchDetailPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SettingsPage from "./pages/SettingsPage";

const SCREENS = [
  { id: "intro", label: "Intro" },
  { id: "login", label: "Login" },
  { id: "search-results", label: "Search Results" },
  { id: "search-detail", label: "Search Detail" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "settings", label: "Settings" },
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

  const ActiveScreen = useMemo(
    () => SCREEN_COMPONENTS[activeScreen] ?? IntroPage,
    [activeScreen],
  );

  function handleNavigateScreen(nextScreen) {
    if (!nextScreen || nextScreen === activeScreen) {
      return;
    }

    setNavigationHistory((currentHistory) => [...currentHistory, activeScreen]);
    setActiveScreen(nextScreen);
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
      screens={SCREENS}
      activeScreen={activeScreen}
      onChangeScreen={handleNavigateScreen}
    >
      <ActiveScreen
        activeScreen={activeScreen}
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
