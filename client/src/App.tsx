import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Timer from "./pages/Timer";
import Schedule from "./pages/Schedule";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingChat from "./components/chat/FloatingChat";
import { AppProvider } from "./context/AppContext";

function Router() {
  return (
    <div className="flex h-full">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <Switch>
          <Route path="/">
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </Route>
          <Route path="/notes">
            <ErrorBoundary>
              <Notes />
            </ErrorBoundary>
          </Route>
          <Route path="/timer">
            <ErrorBoundary>
              <Timer />
            </ErrorBoundary>
          </Route>
          <Route path="/schedule">
            <ErrorBoundary>
              <Schedule />
            </ErrorBoundary>
          </Route>
          <Route path="/community">
            <ErrorBoundary>
              <Community />
            </ErrorBoundary>
          </Route>
          <Route path="/messages">
            <ErrorBoundary>
              <Messages />
            </ErrorBoundary>
          </Route>
          <Route path="/profile">
            <ErrorBoundary>
              <Profile />
            </ErrorBoundary>
          </Route>
          <Route>
            <ErrorBoundary>
              <NotFound />
            </ErrorBoundary>
          </Route>
        </Switch>
      </div>
      <ErrorBoundary>
        <FloatingChat />
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
