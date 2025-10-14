import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const mountEl = document.getElementById("root")!;

console.info("[Build] Render start", {
  mode: import.meta.env.MODE,
  base: import.meta.env.BASE_URL,
  ts: new Date().toISOString(),
});

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", (payload) => {
    console.info("[HMR] beforeUpdate", payload);
  });
  import.meta.hot.on("vite:afterUpdate", (payload) => {
    console.info("[HMR] afterUpdate", payload);
  });
  import.meta.hot.on("vite:beforeFullReload", () => {
    console.info("[HMR] beforeFullReload");
  });
}

createRoot(mountEl).render(<App />);
