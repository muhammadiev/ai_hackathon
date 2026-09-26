import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext.jsx";
import { I18nProvider } from "./I18nContext.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import App from "./App.jsx";
import "./index.css";
import "./school/school.css";
import { SchoolProvider } from "./school/SchoolContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <SchoolProvider>
                <App />
              </SchoolProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
