import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "@/components/root/App/App";
import { i18nReady } from "@/i18n";
import { store } from "@/store";
import { setupLanguage } from "@/store/locale/localeSlice";
import "@/styles/tw.css";
import "@/styles/index.scss";

void i18nReady
  .then(() => {
    return store.dispatch(setupLanguage());
  })
  .then(() => {
    return createRoot(document.getElementById("root")!).render(
      <Provider store={store}>
        <App />
      </Provider>,
    );
  });
