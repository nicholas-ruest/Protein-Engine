/* @refresh reload */
import { render } from "solid-js/web";
import { App } from "./App";
import { EngineContext } from "./stores/engine";
import { selectTransport } from "./transport/select";
import { setSession } from "./stores/session";
import { setLedger } from "./stores/ledger";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root element");

selectTransport().then((engine) => {
  setSession("mode", engine.mode);

  engine.subscribe((e) => {
    if (e.kind === "ledger.appended") {
      setLedger("head", e.head);
      setLedger("entry_count", e.entry_count);
      setLedger("recent", (r) => [
        ...r,
        { hash: e.head, ts: Date.now(), label: "appended" },
      ]);
    }
  });

  render(
    () => (
      <EngineContext.Provider value={engine}>
        <App />
      </EngineContext.Provider>
    ),
    root,
  );
});
