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
  { id: "history", label: "History" }
];

const SCREEN_COMPONENTS = {
  intro: IntroPage,
  login: LoginPage,
  "search-results": SearchResultsPage,
  "search-detail": SearchDetailPage,
  bookmarks: BookmarksPage,
  settings: SettingsPage,
  history: HistoryPage
};

function App() {
  const [activeScreen, setActiveScreen] = useState("intro");

  const ActiveScreen = useMemo(
    () => SCREEN_COMPONENTS[activeScreen] ?? IntroPage,
    [activeScreen]
  );

  return (
    <AppFrame
      screens={SCREENS}
      activeScreen={activeScreen}
      onChangeScreen={setActiveScreen}
    >
      <ActiveScreen onNavigateScreen={setActiveScreen} />
    </AppFrame>
  );
}

export default App;
