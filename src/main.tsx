import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import faviconUrl from "./assets/favicon-compact.svg";

const favicon = document.createElement("link");
favicon.rel = "icon";
favicon.type = "image/png";
favicon.href = faviconUrl;
favicon.sizes = "512x512";
document.head.appendChild(favicon);

const touchIcon = document.createElement("link");
touchIcon.rel = "apple-touch-icon";
touchIcon.href = faviconUrl;
touchIcon.sizes = "512x512";
document.head.appendChild(touchIcon);

createRoot(document.getElementById("root")!).render(<App />);
