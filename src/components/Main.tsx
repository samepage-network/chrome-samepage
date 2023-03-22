import React from "react";
import defaultSettings from "samepage/utils/defaultSettings";
import { AppData } from "../utils/types";
import { Button, InputGroup, Label } from "@blueprintjs/core";

const TABS = ["home", "settings"];

// TODO - Allow TW to pick up on extension classes
const Main = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const globalSettingsRef = React.useRef<Record<string, string>>({});
  const [globalSettings, setGlobalSettings] = React.useState(
    globalSettingsRef.current
  );
  const refreshGlobalSettings = React.useCallback(
    () => setGlobalSettings({ ...globalSettingsRef.current }),
    [globalSettingsRef, setGlobalSettings]
  );
  const resetGlobalSettings = React.useRef(() => {});
  React.useEffect(() => {
    chrome.tabs
      .query({ lastFocusedWindow: true, active: true })
      .then((tabs) => {
        return tabs[0]?.id
          ? chrome.tabs.sendMessage(tabs[0].id, { type: "SETUP" })
          : Promise.reject(new Error("No active tab found."));
      })
      .then((appData: AppData) => {
        if (appData) {
          const key = `${appData.app}:${appData.workspace}`;
          return chrome.storage.sync.get(key).then((data) => {
            Object.entries(data[key] || {}).forEach(([k, v]) => {
              globalSettingsRef.current[k] = v as string;
            });
            refreshGlobalSettings();
            resetGlobalSettings.current = () => {
              chrome.storage.sync.remove(key);
              globalSettingsRef.current = {};
              refreshGlobalSettings();
            };
          });
        } else {
          Object.keys(globalSettings).forEach((k) => {
            delete globalSettingsRef.current[k];
          });
          refreshGlobalSettings();
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        setLoading(false);
      });
  }, [setLoading]);
  return (
    <div className="flex" style={{ width: 480, height: 360 }}>
      <div className="w-32" style={{ width: 128 }}>
        {TABS.map((t, i) => (
          <div
            className={`capitalize cursor-pointer py-4 px-6 rounded-lg hover:bg-sky-400${
              t === TABS[currentTab] ? " bg-sky-200" : ""
            }`}
            style={{
              textTransform: "capitalize",
              cursor: "pointer",
              padding: "16px 24px",
              borderRadius: "12px",
              background:
                t === TABS[currentTab] ? "rgb(186, 230, 253)" : "inherit",
            }}
            key={t}
            onClick={() => {
              setCurrentTab(i);
            }}
          >
            {t}
          </div>
        ))}
      </div>
      <div
        className="flex-grow p-8 h-full"
        style={{ padding: 32, height: "100%" }}
      >
        {loading ? (
          <span>Loading...</span>
        ) : error ? (
          <span className="text-red-800">{error}</span>
        ) : TABS[currentTab] === "home" ? (
          <div>
            {Object.keys(globalSettings).length > 1
              ? "Welcome to SamePage"
              : "This app is not currently integrated with SamePage"}
          </div>
        ) : TABS[currentTab] === "settings" ? (
          <div className="py-2 flex flex-col gap-2">
            <Label>
              {defaultSettings[0].name}
              <InputGroup
                placeholder={defaultSettings[0].name}
                disabled
                defaultValue={
                  globalSettings[defaultSettings[0].id] ||
                  defaultSettings[0].default
                }
              />
            </Label>
            <Label>
              {defaultSettings[1].name}
              <InputGroup
                placeholder={defaultSettings[1].name}
                disabled
                defaultValue={
                  globalSettings[defaultSettings[1].id] ||
                  defaultSettings[1].default
                }
                type={"password"}
              />
            </Label>
            <div
              className="flex-grow flex justicy-end flex-col"
              style={{ justifyContent: "end" }}
            >
              {globalSettings[defaultSettings[0].id] ||
              defaultSettings[0].default ? (
                <Button
                  text={"Log Out"}
                  intent={"warning"}
                  onClick={() => {
                    resetGlobalSettings.current();
                    setCurrentTab(0);
                  }}
                />
              ) : (
                <Button
                  text={"Connect"}
                  intent={"primary"}
                  onClick={() => {
                    chrome.tabs
                      .query({ lastFocusedWindow: true, active: true })
                      .then((tabs) =>
                        tabs[0]?.id
                          ? chrome.tabs.sendMessage(tabs[0].id, {
                              type: "CONNECT",
                            })
                          : Promise.reject(new Error("No active tab found."))
                      )
                      .catch((e) => setError(e.message));
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <span>Unknown tab</span>
        )}
      </div>
    </div>
  );
};

export default Main;
