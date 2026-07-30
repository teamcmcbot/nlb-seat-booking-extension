import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

const ROOT_ID = "nlb-seat-helper-root";

if (!document.getElementById(ROOT_ID)) {
  const container = document.createElement("div");
  container.id = ROOT_ID;
  document.body.append(container);

  createRoot(container).render(<App />);
}
