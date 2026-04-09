import { useState, useEffect } from "react";
import ScreenQuickActions from "../components/ScreenQuickActions";
import { apiClient } from "../api/apiClient";

function SettingsPage({ activeScreen, onGoBack, onNavigateScreen }) {
  const [activePreference, setActivePreference] = useState(null);
  const [activeAccountAction, setActiveAccountAction] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [editValues, setEditValues] = useState({});
  const [editAllMode, setEditAllMode] = useState(false);
  const [emailForm, setEmailForm] = useState({
    previousEmail: "",
    newEmail: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    previousPassword: "",
    newPassword: "",
  });
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await apiClient("/api/settings/preferences");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const json = await response.json();
        setPreferences(json.data);
        const initial = {};
        json.data.forEach((p) => {
          initial[p.id] = p.value;
        });
        setEditValues(initial);
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      }
    };
    fetchPreferences();
  }, []);

  const handlePreferenceClick = (preferenceId) => {
    setActivePreference((current) =>
      current === preferenceId ? null : preferenceId,
    );
  };

  const handleAccountActionClick = (actionType) => {
    setActiveAccountAction((current) =>
      current === actionType ? null : actionType,
    );
    setStatusMessage(null);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient("/api/settings/email", {
        method: "PUT",
        body: JSON.stringify(emailForm),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      setStatusMessage({ type: "success", text: json.message });
      setEmailForm({ previousEmail: "", newEmail: "" });
      setActiveAccountAction(null);
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient("/api/settings/password", {
        method: "PUT",
        body: JSON.stringify(passwordForm),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      setStatusMessage({ type: "success", text: json.message });
      setPasswordForm({ previousPassword: "", newPassword: "" });
      setActiveAccountAction(null);
    } catch (error) {
      setStatusMessage({ type: "error", text: error.message });
    }
  };

  const handleSavePreference = async (preferenceId) => {
    try {
      const response = await apiClient("/api/settings/preferences", {
        method: "PUT",
        body: JSON.stringify([
          { id: preferenceId, value: editValues[preferenceId] },
        ]),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      setPreferences((prev) =>
        prev.map((p) =>
          p.id === preferenceId ? { ...p, value: editValues[preferenceId] } : p,
        ),
      );
      setActivePreference(null);
    } catch (error) {
      console.error("Failed to save preference:", error);
    }
  };

  const handleSaveAllPreferences = async () => {
    try {
      const updates = preferences.map((p) => ({
        id: p.id,
        value: editValues[p.id],
      }));
      const response = await apiClient("/api/settings/preferences", {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      setPreferences((prev) =>
        prev.map((p) => ({ ...p, value: editValues[p.id] })),
      );
      setEditAllMode(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }
  };

  return (
    <section className="screen settings-screen">
      <div className="settings-panel">
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
            Manage your account details and choose the defaults you want ready
            for every search.
          </p>
        </header>

        {statusMessage ? (
          <p
            className={`settings-status-message settings-status-message--${statusMessage.type}`}
          >
            {statusMessage.text}
          </p>
        ) : null}

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
                <form
                  className="account-action-panel"
                  onSubmit={handleChangeEmail}
                >
                  <input
                    className="account-detail-input"
                    type="email"
                    placeholder="Previous Email"
                    value={emailForm.previousEmail}
                    onChange={(e) =>
                      setEmailForm((f) => ({
                        ...f,
                        previousEmail: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className="account-detail-input"
                    type="email"
                    placeholder="New Email"
                    value={emailForm.newEmail}
                    onChange={(e) =>
                      setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
                    }
                    required
                  />
                  <button className="account-submit-button" type="submit">
                    Save
                  </button>
                </form>
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
                <form
                  className="account-action-panel"
                  onSubmit={handleChangePassword}
                >
                  <input
                    className="account-detail-input"
                    type="password"
                    placeholder="Previous Password"
                    value={passwordForm.previousPassword}
                    onChange={(e) =>
                      setPasswordForm((f) => ({
                        ...f,
                        previousPassword: e.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    className="account-detail-input"
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((f) => ({
                        ...f,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                  <button className="account-submit-button" type="submit">
                    Save
                  </button>
                </form>
              ) : null}
            </div>
          </div>

          <div className="settings-card settings-card--preferences">
            <h3>Search Defaults</h3>
            <div className="preferences-list">
              {preferences.map((preference) => {
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

                    {isActive && !editAllMode ? (
                      <div className="preference-item__actions">
                        <input
                          className="preference-edit-input"
                          type="text"
                          value={editValues[preference.id] ?? preference.value}
                          onChange={(e) =>
                            setEditValues((v) => ({
                              ...v,
                              [preference.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="preference-edit-button"
                          type="button"
                          onClick={() => handleSavePreference(preference.id)}
                        >
                          Save
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {editAllMode ? (
              <div className="preferences-edit-all-panel">
                {preferences.map((preference) => (
                  <div className="preference-edit-all-row" key={preference.id}>
                    <label className="preference-edit-all-label">
                      {preference.label}
                    </label>
                    <input
                      className="preference-edit-input"
                      type="text"
                      value={editValues[preference.id] ?? preference.value}
                      onChange={(e) =>
                        setEditValues((v) => ({
                          ...v,
                          [preference.id]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="preferences-edit-all-actions">
                  <button
                    className="preferences-edit-all-button"
                    type="button"
                    onClick={() => setEditAllMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="preferences-edit-all-button"
                    type="button"
                    onClick={handleSaveAllPreferences}
                  >
                    Save All
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="preferences-edit-all-button"
                type="button"
                onClick={() => setEditAllMode(true)}
              >
                Edit All
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
