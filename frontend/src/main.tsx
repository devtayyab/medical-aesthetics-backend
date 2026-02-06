
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store";
import { setupAxiosInterceptors } from "./services/api";
import { setTokens, logout } from "./store/slices/authSlice";
import "@/styles/globals.css";

setupAxiosInterceptors(store, { setTokens, logout });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
