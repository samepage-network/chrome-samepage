import setupSamePageClient from "samepage/protocols/setupSamePageClient";
import loadSharePageWithNotebook from "samepage/protocols/sharePageWithNotebook";
import defaultSettings from "samepage/utils/defaultSettings";
import { z } from "zod";
import renderOverlay from "./utils/renderOverlay";

const globalSettings: Record<string, string> = {};

const setupUserSettings = async () => {
  const settings = defaultSettings.map((d) => ({
    id: d.id, // string
    name: d.name, // string
    description: d.description, // string
    value: d.default, // boolean or string
    type: d.type, // "boolean" or "string"
  }));
  await Promise.all(
    settings.map((s) =>
      chrome.storage.sync
        .get(s.id)
        .then((all) => (globalSettings[s.id] = all[s.id] || s.value))
    )
  );
};

const setupClient = (notebook: { app: "Notion"; workspace: string }) => {
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

  const { unload } = setupSamePageClient({
    ...notebook,
    getSetting: (s) => globalSettings[s],
    setSetting: (s, v) => {
      globalSettings[s] = v;
      chrome.storage.sync.set({ [s]: v });
    },
    notificationContainerPath: ".notion-topbar-action-buttons",
    renderOverlay,
    // Interact with user
    // addCommand: window.roamAlphaAPI.ui.commandPalette.addCommand,
    // removeCommand: window.roamAlphaAPI.ui.commandPalette.removeCommand,
  });
  return unload;
};

const setupSharePageWithNotebook = () => {
  const { unload } = loadSharePageWithNotebook({
    // getCurrentNotebookPageId,
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

const zSetup = z
  .object({ app: z.literal("Notion"), workspace: z.string() })
  .or(z.literal(false))
  .or(z.undefined());

const setup = async () => {
  const response = await chrome.runtime.sendMessage({
    type: "SETUP",
    data: { href: window.location.href },
  });
  const data = zSetup.parse(response);
  if (data) {
    setupUserSettings();
    const unloadClient = setupClient(data);
    const unloadProtocols = setupProtocols();
    return () => {
      unloadProtocols();
      unloadClient();
    };
  }
};

setup();
