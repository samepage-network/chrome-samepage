import React from "react";
import defaultSettings from "samepage/utils/defaultSettings";
import { AppData } from "../utils/types";

const globalSettings: Record<string, string> = {};

const Home = () => {
  return (
    <div>
      {Object.keys(globalSettings).length > 1
        ? "Welcome to SamePage"
        : "This app is not currently integrated with SamePage"}
    </div>
  );
};

const Settings = () => {
  return (
    <div className="py-2 flex flex-col gap-2">
      <input
        placeholder={defaultSettings[0].name}
        disabled
        defaultValue={
          globalSettings[defaultSettings[0].id] || defaultSettings[0].default
        }
      />
      <input
        placeholder={defaultSettings[1].name}
        disabled
        defaultValue={
          globalSettings[defaultSettings[1].id] || defaultSettings[1].default
        }
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
  React.useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "GET", data: {} })
      .then((appData: AppData) => {
        if (appData) {
          const key = `${appData.app}:${appData.workspace}`;
          return chrome.storage.sync.get(key).then((data) => {
            Object.entries(data[key] || {}).forEach(([k, v]) => {
              globalSettings[k] = v as string;
            });
          });
        } else {
          Object.keys(globalSettings).forEach((k) => {
            delete globalSettings[k];
          });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setLoading]);
  return (
    <div className="flex max-w-3xl w-full">
      <div className="w-32" style={{ width: 128 }}>
        {TABS.map((t, i) => (
          <div
            className={`capitalize cursor py-4 px-6 rounded-lg hover:bg-sky-400${
              t.id === TABS[currentTab].id ? " bg-sky-200" : ""
            }`}
            key={t.id}
            onClick={() => {
              setCurrentTab(i);
            }}
          >
            {t.id}
          </div>
        ))}
      </div>
      <div className="flex-grow">
        {loading ? <span>Loading...</span> : <Panel />}
      </div>
    </div>
  );
};

export default Main;
