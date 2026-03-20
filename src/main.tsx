import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onOfflineReady() {
    console.log("App is ready for offline use");
  },
  onNeedRefresh() {
    console.log("New update available");

    // optional auto-refresh or manual prompt
    if (confirm("New update available. Reload now?")) {
      updateSW(true);
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);