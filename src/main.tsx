import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import App from "./App.tsx";
import "./index.css";

// Keep cached data around long enough to be useful offline.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days — survives offline stretches
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Persist the query cache to localStorage so the list is readable with no signal.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: "books-query-cache",
});

createRoot(document.getElementById("root")!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 14 }}
  >
    <App />
  </PersistQueryClientProvider>
);
