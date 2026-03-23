import { useState } from "react";

const DEFAULT_PREFERENCES = [
  { id: "airport", label: "Default Airport", value: "JFK" },
  { id: "airline", label: "Default Airline", value: "Delta" },
  { id: "card", label: "Default Credit Card", value: "Chase Sapphire Preferred" }
];

function SettingsPage() {
  const [showDefaultPreferences, setShowDefaultPreferences] = useState(false);
  const [activePreference, setActivePreference] = useState(null);

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

  return (
    <section className="screen">
      <h2>Settings Screen</h2>
      <p>Manage your account details and choose the defaults you want ready for every search.</p>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Account</h3>
          <button className="settings-action-button" type="button">
            Change Email
          </button>
          <button className="settings-action-button" type="button">
            Change Password
          </button>
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
