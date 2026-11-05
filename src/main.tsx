import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { router } from "./router";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/app.css";
import "./styles/landing.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/missions.css";
import "./styles/specialty.css";
import "./styles/studio.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
