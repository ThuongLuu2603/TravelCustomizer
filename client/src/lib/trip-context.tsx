import { createContext, useContext, useState, ReactNode } from "react";
import { type InsertTrip } from "@shared/schema";

// Define the trip context interface extending InsertTrip
interface TripContextData extends Partial<InsertTrip> {
  tripId?: number;
  origin_id?: number;
  destination_id?: number;
  transportation_type_id?: number;
  start_date?: string;
  end_date?: string;
  accommodations?: {
    id: number;
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
  }[];
  selectedTransportation?: number;
  selectedDepartureOption?: number;
  selectedReturnOption?: number;
  selectedAccommodations?: { [key: number]: number | null };
  selectedAttractions?: { 
    attractionId: number;
    day: number;
    timeSlot?: string;
  }[];
  totalPrice?: number;
}

// Define the context interface
interface TripContextType {
  tripData: TripContextData;
  updateTripData: (data: Partial<TripContextData>) => void;
  resetTripData: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

// Create the context
const TripContext = createContext<TripContextType | undefined>(undefined);

// Default trip data
const defaultTripData: TripContextData = {
  accommodations: [{ id: 1, location: "", checkIn: undefined, checkOut: undefined }],
  selectedTransportation: undefined,
  selectedDepartureOption: undefined,
  selectedReturnOption: undefined,
  selectedAccommodations: {},
  selectedAttractions: [],
  totalPrice: 0
};

// Create the provider component
export function TripProvider({ children }: { children: ReactNode }) {
  const [tripData, setTripData] = useState<TripContextData>(defaultTripData);
  const [currentStep, setCurrentStep] = useState(1);

  // Update trip data
  const updateTripData = (data: Partial<TripContextData>) => {
    setTripData((prevData) => ({
      ...prevData,
      ...data,
    }));
  };

  // Reset trip data
  const resetTripData = () => {
    setTripData(defaultTripData);
    setCurrentStep(1);
  };

  // Context value
  const value: TripContextType = {
    tripData,
    updateTripData,
    resetTripData,
    currentStep,
    setCurrentStep,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// Custom hook to use the trip context
export function useTripContext() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTripContext must be used within a TripProvider");
  }
  return context;
}
