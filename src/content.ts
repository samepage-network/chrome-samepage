import setupSamePageClient from "samepage/protocols/setupSamePageClient";
import loadSharePageWithNotebook from "samepage/protocols/sharePageWithNotebook";
import defaultSettings from "samepage/utils/defaultSettings";
import renderOverlay from "./utils/renderOverlay";
import { SupportedNotebook, zSetup } from "./utils/types";

const globalSettings: Record<string, string> = {};

const setupUserSettings = async (data: SupportedNotebook) => {
  const settings = defaultSettings.map((d) => ({
    id: d.id, // string
    name: d.name, // string
    description: d.description, // string
    value: d.default, // boolean or string
    type: d.type, // "boolean" or "string"
  }));
  const key = `${data.app}:${data.workspace}`;
  await chrome.storage.sync.get(key).then((d) => {
    settings.forEach((s) => {
      globalSettings[s.id] = d[key]?.[s.id] || s.value;
    });
  });
};

const commands: Record<string, () => void> = {};

const setupClient = (notebook: SupportedNotebook) => {
  // blueprintjs fails to load through samepage.css
  // but ideally we just remove blueprint entirely in the future
  if (!document.getElementById("blueprint-css")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://unpkg.com/@blueprintjs/core@^4.8.0/lib/css/blueprint.css";
    link.id = "blueprint-css";
    document.head.appendChild(link);
  }

  const key = `${notebook.app}:${notebook.workspace}`;
  const { unload } = setupSamePageClient({
    ...notebook,
    getSetting: (s) => globalSettings[s],
    setSetting: (s, v) => {
      globalSettings[s] = v;
      chrome.storage.sync.set({ [key]: globalSettings });
    },
    notificationContainerPath: ".notion-topbar-share-menu",
    renderOverlay,
    addCommand: ({ label, callback }) => {
      commands[label] = callback;
    },
    removeCommand: ({ label }) => {
      delete commands[label];
    },
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.metaKey &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.altKey &&
      e.key.length === 1
    ) {
      const command = Object.entries(commands).reduce((p, c) => {
        const prevIndex = p[0].toLowerCase().indexOf(e.key.toLowerCase());
        const curIndex = p[0].toLowerCase().indexOf(e.key.toLowerCase());
        return curIndex < prevIndex ? c : p;
      });
      if (command) {
        command[1]();
        console.log(`Fired ${command[0]}`);
      }
    }
  });
  return unload;
};

const setupSharePageWithNotebook = () => {
  const { unload } = loadSharePageWithNotebook({
    getCurrentNotebookPageId: async () => document.location.pathname,
    // createPage,
    // openPage,
    // deletePage,
    // applyState,
    // calculateState,
    // overlayProps,
  });

  return unload;
};

const setupToolSpecificProtocol = () => {
  // anything specific to this tool
  return () => {};
};

const setupProtocols = () => {
  const unloadSharePageWithNotebook = setupSharePageWithNotebook();
  const unloadToolSpecificProtocol = setupToolSpecificProtocol();
  // add more here
  return () => {
    unloadToolSpecificProtocol();
    unloadSharePageWithNotebook();
  };
};

const setup = async () => {
  const response = await chrome.runtime.sendMessage({
    type: "SETUP",
    data: { href: window.location.href },
  });
  const data = zSetup.parse(response);
  if (data) {
    await setupUserSettings(data);
    const unloadClient = setupClient(data);
    const unloadProtocols = setupProtocols();
    return () => {
      unloadProtocols();
      unloadClient();
    };
  }
};

setup();
