import { useState } from "react";
import ScreenQuickActions from "../components/ScreenQuickActions";

const DEFAULT_PREFERENCES = [
  { id: "airport", label: "Default Airport", value: "JFK" },
  { id: "airline", label: "Default Airline", value: "Delta" },
  { id: "card", label: "Default Credit Card", value: "Chase Sapphire Preferred" }
];

function SettingsPage({ activeScreen, onGoBack, onNavigateScreen }) {
  const [showDefaultPreferences, setShowDefaultPreferences] = useState(false);
  const [activePreference, setActivePreference] = useState(null);
  const [activeAccountAction, setActiveAccountAction] = useState(null);

  const handleToggleDefaultPreferences = () => {
    setShowDefaultPreferences((current) => {
      if (current) {
        setActivePreference(null);
      }

      return !current;
    });
  };

  const handlePreferenceClick = (preferenceId) => {
    setActivePreference((current) =>
      current === preferenceId ? null : preferenceId
    );
  };

  const handleAccountActionClick = (actionType) => {
    setActiveAccountAction((current) =>
      current === actionType ? null : actionType
    );
  };

  return (
    <section className="screen settings-screen">
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

      <header className="settings-header">
        <p className="settings-header__eyebrow">Preferences and account</p>
        <h2 className="settings-header__title">Settings</h2>
        <p className="settings-header__copy">
          Manage your account details and choose the defaults you want ready for every search.
        </p>
      </header>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Account</h3>
          <div className="account-action-group">
            <button
              className={`settings-action-button${
                activeAccountAction === "email" ? " is-open" : ""
              }`}
              type="button"
              onClick={() => handleAccountActionClick("email")}
            >
              Change Email
            </button>

            {activeAccountAction === "email" ? (
              <div className="account-action-panel">
                <button className="account-detail-button" type="button">
                  Previous Email
                </button>
                <button className="account-detail-button" type="button">
                  New Email
                </button>
              </div>
            ) : null}
          </div>

          <div className="account-action-group">
            <button
              className={`settings-action-button${
                activeAccountAction === "password" ? " is-open" : ""
              }`}
              type="button"
              onClick={() => handleAccountActionClick("password")}
            >
              Change Password
            </button>

            {activeAccountAction === "password" ? (
              <div className="account-action-panel">
                <button className="account-detail-button" type="button">
                  Previous Password
                </button>
                <button className="account-detail-button" type="button">
                  New Password
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="settings-card settings-card--preferences">
          <h3>Search Defaults</h3>
          <button
            className={`settings-toggle-button${showDefaultPreferences ? " is-open" : ""}`}
            type="button"
            onClick={handleToggleDefaultPreferences}
          >
            Default Preferences
          </button>

          {showDefaultPreferences ? (
            <div className="preferences-panel">
              <div className="preferences-list">
                {DEFAULT_PREFERENCES.map((preference) => {
                  const isActive = activePreference === preference.id;

                  return (
                    <div className="preference-item" key={preference.id}>
                      <button
                        className={`preference-button${isActive ? " is-active" : ""}`}
                        type="button"
                        onClick={() => handlePreferenceClick(preference.id)}
                      >
                        <span className="preference-button__label">
                          {preference.label}
                        </span>
                        <span className="preference-button__value">
                          {preference.value}
                        </span>
                      </button>

                      {isActive ? (
                        <div className="preference-item__actions">
                          <button className="preference-edit-button" type="button">
                            Edit
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <button className="preferences-edit-all-button" type="button">
                Edit All
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
