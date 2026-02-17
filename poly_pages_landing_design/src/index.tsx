import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LandingPageDesign } from "./screens/LandingPageDesign";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <LandingPageDesign />
  </StrictMode>,
);
