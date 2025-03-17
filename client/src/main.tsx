import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { TripProvider } from "./lib/trip-context";

createRoot(document.getElementById("root")!).render(
  <TripProvider>
    <App />
  </TripProvider>
);
