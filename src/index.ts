import { createRoot } from "react-dom/client";
import Main from "./components/Main";
import React from "react";

const app = document.getElementById("app");
if (app) {
  const root = createRoot(app);
  root.render(React.createElement(Main));
}
