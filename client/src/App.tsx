import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TripProvider } from "./lib/trip-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import TripPlanner from "@/pages/trip-planner/TripPlanner";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trip-planner" component={TripPlanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TripProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TripProvider>
    </QueryClientProvider>
  );
}

export default App;
