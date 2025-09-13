import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@app/index.css";
import RootApp from "@app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
