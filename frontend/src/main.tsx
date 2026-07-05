import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./features/auth/context/AuthContext";
import { CryptoProvider } from "./crypto/CryptoContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CryptoProvider>
          <App />
        </CryptoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
