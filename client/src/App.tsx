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
import { useEffect } from "react";
import { ClientSettings } from "./lib/types";

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

function ThemeInitializer() {
  useEffect(() => {
    // Initialize settings if they don't exist
    const savedSettings = localStorage.getItem('userSettings');
    if (!savedSettings) {
      const defaultSettings: ClientSettings = {
        theme: 'light',
        notificationsEnabled: true,
        soundsEnabled: true,
        autoJoinCalls: false,
        privacy: 'public',
        fontSize: 'medium',
      };
      localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      
      // Apply default theme
      document.documentElement.classList.remove('dark');
      
      // Apply default font size
      document.documentElement.style.fontSize = '16px';
    } else {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        
        // Apply saved theme
        if (parsedSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (parsedSettings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (parsedSettings.theme === 'system') {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        // Apply saved font size
        const fontSize = parsedSettings.fontSize;
        if (fontSize === 'small') {
          document.documentElement.style.fontSize = '14px';
        } else if (fontSize === 'medium') {
          document.documentElement.style.fontSize = '16px';
        } else if (fontSize === 'large') {
          document.documentElement.style.fontSize = '18px';
        }
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, []);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeInitializer />
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
