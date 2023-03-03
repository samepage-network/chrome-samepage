import setupSamePageClient from "samepage/protocols/setupSamePageClient";
import loadSharePageWithNotebook from "samepage/protocols/sharePageWithNotebook";
import defaultSettings from "samepage/utils/defaultSettings";
import renderOverlay from "./utils/renderOverlay";
import { SupportedNotebook, zSetup } from "./utils/types";
import { v4 } from "uuid";
import CommandPalette from "./components/CommandPalette";
import renderToast from "./components/Toast";

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
    console.log("settings", settings, d);
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
    onAppLog: (evt) =>
      evt.intent !== "debug" &&
      renderToast({
        id: evt.id,
        content: evt.content,
        intent:
          evt.intent === "error"
            ? "danger"
            : evt.intent === "info"
            ? "primary"
            : evt.intent,
      }),
  });
  document.addEventListener("keydown", (e) => {
    if (
      !e.altKey &&
      !e.shiftKey &&
      !e.ctrlKey &&
      e.metaKey &&
      /^(Key)?[pP]$/.test(e.key)
    ) {
      renderOverlay({
        Overlay: CommandPalette,
        props: {
          commands: Object.entries(commands).map(([label, callback]) => ({
            label,
            callback,
          })),
        },
      });
      e.preventDefault();
      e.stopPropagation();
    }
  });
  return unload;
};

const setupSharePageWithNotebook = () => {
  const getCurrentNotebookPageId = () =>
    document.location.pathname.replace(/^\//, "");
  const { unload, refreshContent } = loadSharePageWithNotebook({
    getCurrentNotebookPageId: async () => getCurrentNotebookPageId(),
    createPage: (notebookPageId: string) =>
      chrome.runtime.sendMessage({
        type: "CREATE_PAGE",
        data: { notebookPageId, path: document.location.pathname },
      }),
    calculateState: (notebookPageId: string) =>
      chrome.runtime
        .sendMessage({
          type: "CALCULATE_STATE",
          data: { notebookPageId },
        })
        .then((r) => {
          if (r.success) {
            return r.data;
          } else {
            return Promise.reject(r.error);
          }
        }),
    overlayProps: {
      viewSharedPageProps: {},
      sharedPageStatusProps: {
        getPaths: (notebookPageId) => {
          const uuidRaw = /[a-f0-9]{32}$/.exec(notebookPageId)?.[0];
          if (!uuidRaw) return [];
          const pageUuid = `${uuidRaw.slice(0, 8)}-${uuidRaw.slice(
            8,
            12
          )}-${uuidRaw.slice(12, 16)}-${uuidRaw.slice(16, 20)}-${uuidRaw.slice(
            20,
            32
          )}`;
          const firstBlock = document.querySelector(
            `.notion-frame div[data-block-id="${pageUuid}"`
          );
          if (!firstBlock || !firstBlock.parentElement) return [];
          const contentEditable = firstBlock.closest(`.whenContentEditable`);
          if (!contentEditable || !contentEditable.parentElement) return [];
          const container = document.createElement("div");
          contentEditable.parentElement.insertBefore(
            container,
            contentEditable
          );
          const sel = v4();
          container.setAttribute("data-samepage-shared", sel);
          return [`div[data-samepage-shared="${sel}"]`];
        },
      },
    },
    openPage: async (notebookPageId) =>
      window.location.assign(`/${notebookPageId}`),
    deletePage: (notebookPageId) =>
      chrome.runtime.sendMessage({
        type: "DELETE_PAGE",
        data: { notebookPageId },
      }),
    applyState: async (notebookPageId, state) =>
      chrome.runtime.sendMessage({
        type: "APPLY_STATE",
        data: { notebookPageId, state },
      }),
  });

  commands["Refresh"] = () => {
    refreshContent({ notebookPageId: getCurrentNotebookPageId() });
  };

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
    data: {},
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
