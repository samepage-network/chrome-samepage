import React from "react";
import defaultSettings from "samepage/utils/defaultSettings";
import { AppData } from "../utils/types";
import { InputGroup } from "@blueprintjs/core";

const Home = ({
  globalSettings,
}: {
  globalSettings: Record<string, string>;
}) => {
  return (
    <div>
      {Object.keys(globalSettings).length > 1
        ? "Welcome to SamePage"
        : "This app is not currently integrated with SamePage"}
    </div>
  );
};

const Settings = ({
  globalSettings,
}: {
  globalSettings: Record<string, string>;
}) => {
  return (
    <div className="py-2 flex flex-col gap-2">
      <InputGroup
        placeholder={defaultSettings[0].name}
        disabled
        defaultValue={
          globalSettings[defaultSettings[0].id] || defaultSettings[0].default
        }
      />
      <InputGroup
        placeholder={defaultSettings[1].name}
        disabled
        defaultValue={
          globalSettings[defaultSettings[1].id] || defaultSettings[1].default
        }
        type={"password"}
      />
    </div>
  );
};

const TABS = [
  { id: "home", Panel: Home },
  { id: "settings", Panel: Settings },
];

// TODO - Allow TW to pick up on extension classes
const Main = () => {
  const [currentTab, setCurrentTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const { Panel } = TABS[currentTab];

  const globalSettingsRef = React.useRef<Record<string, string>>({});
  const [globalSettings, setGlobalSettings] = React.useState(
    globalSettingsRef.current
  );
  const refreshGlobalSettings = React.useCallback(
    () => setGlobalSettings({ ...globalSettingsRef.current }),
    [globalSettingsRef, setGlobalSettings]
  );
  React.useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "SETUP", data: {} })
      .then((appData: AppData) => {
        if (appData) {
          const key = `${appData.app}:${appData.workspace}`;
          return chrome.storage.sync.get(key).then((data) => {
            Object.entries(data[key] || {}).forEach(([k, v]) => {
              globalSettingsRef.current[k] = v as string;
            });
            refreshGlobalSettings();
          });
        } else {
          Object.keys(globalSettings).forEach((k) => {
            delete globalSettingsRef.current[k];
          });
          refreshGlobalSettings();
        }
      })
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
              t.id === TABS[currentTab].id ? " bg-sky-200" : ""
            }`}
            style={{
              textTransform: "capitalize",
              cursor: "pointer",
              padding: "16px 24px",
              borderRadius: "12px",
              background:
                t.id === TABS[currentTab].id ? "rgb(186, 230, 253)" : "inherit",
            }}
            key={t.id}
            onClick={() => {
              setCurrentTab(i);
            }}
          >
            {t.id}
          </div>
        ))}
      </div>
      <div className="flex-grow p-8" style={{ padding: 32 }}>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <Panel globalSettings={globalSettings} />
        )}
      </div>
    </div>
  );
};

export default Main;
