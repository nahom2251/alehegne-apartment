import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onOfflineReady() {
    console.log("App is ready for offline use");
  },
  onNeedRefresh() {
    console.log("New update available");
  },
});

createRoot(document.getElementById("root")!).render(<App />);