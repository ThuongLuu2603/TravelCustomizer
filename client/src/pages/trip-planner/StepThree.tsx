import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

interface Attraction {
  id: number;
  name: string;
  location_id: number;
  description: string;
  price: number;
  duration: string;
  image_url: string;
  is_recommended: boolean;
}

interface DayAttraction {
  attractionId: number;
  day: number;
  timeSlot?: string;
}

export default function StepThree() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const [selectedTab, setSelectedTab] = useState<string>("1");
  const [selectedAttractions, setSelectedAttractions] = useState<DayAttraction[]>(
    tripData.selectedAttractions || []
  );
  const [totalPrice, setTotalPrice] = useState<number>(tripData.totalPrice || 0);
  const [days, setDays] = useState<Date[]>([]);

  // Get destination information
  const { data: destinationLocation } = useQuery<any>({
    queryKey: [`/api/locations/${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
  });

  // Get attractions for the destination
  const { data: attractions, isLoading: isLoadingAttractions } = useQuery<Attraction[]>({
    queryKey: [`/api/attractions?locationId=${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
  });

  // Initialize days array based on trip dates
  useEffect(() => {
    if (tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      const dayCount = differenceInDays(end, start) + 1;
      
      const daysArray: Date[] = [];
      for (let i = 0; i < dayCount; i++) {
        daysArray.push(addDays(start, i));
      }
      
      setDays(daysArray);
    }
  }, [tripData.start_date, tripData.end_date]);

  // Calculate total price including attractions
  useEffect(() => {
    // Start with base price from previous step
    let price = tripData.totalPrice || 0;
    
    // Add attraction prices
    if (selectedAttractions.length > 0 && attractions && Array.isArray(attractions)) {
      selectedAttractions.forEach((selected) => {
        const attraction = attractions.find((a: Attraction) => a.id === selected.attractionId);
        if (attraction) {
          price += Number(attraction.price);
        }
      });
    }
    
    setTotalPrice(price);
  }, [selectedAttractions, attractions, tripData.totalPrice]);

  // Toggle an attraction for a specific day
  const toggleAttraction = (attractionId: number, day: number) => {
    setSelectedAttractions((prev) => {
      // Check if the attraction is already selected for this day
      const index = prev.findIndex(
        (item) => item.attractionId === attractionId && item.day === day
      );
      
      if (index >= 0) {
        // If found, remove it
        return prev.filter((_, i) => i !== index);
      } else {
        // If not found, add it
        return [...prev, { attractionId, day }];
      }
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  };

  // Check if an attraction is selected for a specific day
  const isAttractionSelected = (attractionId: number, day: number) => {
    return selectedAttractions.some(
      (item) => item.attractionId === attractionId && item.day === day
    );
  };

  // Handle continue button click
  const handleContinue = () => {
    // Update trip data with selections
    updateTripData({
      selectedAttractions,
      totalPrice
    });
    
    // Go to next step
    setCurrentStep(4);
  };

  // Handle back button click
  const handleBack = () => {
    setCurrentStep(2);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">Bước 3: Chọn điểm tham quan theo ngày</h2>
        
        {/* Trip summary */}
        <div className="bg-neutral-100 p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-2 md:mb-0">
              <h3 className="font-medium">Điểm đến: {destinationLocation && destinationLocation.name ? destinationLocation.name : "Đang tải..."}</h3>
              <p className="text-sm text-neutral-600">
                {days.length > 0 ? (
                  <>
                    {formatDate(days[0])} - {formatDate(days[days.length - 1])}
                    <Badge variant="outline" className="ml-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-200">
                      {days.length} ngày
                    </Badge>
                  </>
                ) : (
                  "Đang tải..."
                )}
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-neutral-600 mr-2">Đã chọn:</p>
              <Badge className="bg-blue-100 text-blue-800">
                {selectedAttractions.length} điểm tham quan
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Day tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-7 h-auto mb-6">
            {days.map((day, index) => (
              <TabsTrigger 
                key={index + 1} 
                value={(index + 1).toString()}
                className={`py-2 ${selectedTab === (index + 1).toString() ? '' : 'text-neutral-600'}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xs font-normal">Ngày {index + 1}</span>
                  <span className="text-sm font-medium">{format(day, "dd/MM", { locale: vi })}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {days.map((day, dayIndex) => (
            <TabsContent key={dayIndex + 1} value={(dayIndex + 1).toString()}>
              <div className="mb-4">
                <h3 className="font-medium text-lg">
                  {format(day, "EEEE, dd/MM/yyyy", { locale: vi })}
                </h3>
                <p className="text-sm text-neutral-600">Chọn các điểm tham quan bạn muốn ghé thăm vào ngày này</p>
              </div>
              
              {isLoadingAttractions ? (
                <div className="py-10 text-center">
                  <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attractions && Array.isArray(attractions) && attractions.map((attraction: Attraction) => (
                    <div 
                      key={attraction.id}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all shadow-hover ${
                        isAttractionSelected(attraction.id, dayIndex + 1) ? 'border-primary bg-blue-50' : 'border-neutral-300 bg-white'
                      }`}
                      onClick={() => toggleAttraction(attraction.id, dayIndex + 1)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">{attraction.name}</h4>
                          {attraction.is_recommended && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Đề xuất
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-neutral-600 mb-3">{attraction.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className="bg-neutral-100 text-neutral-700">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {attraction.duration}
                          </Badge>
                          
                          <Badge variant="outline" className="bg-neutral-100 text-neutral-700">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {attraction.price.toLocaleString()}₫
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          {isAttractionSelected(attraction.id, dayIndex + 1) ? (
                            <Badge className="bg-primary text-white">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Đã chọn
                            </Badge>
                          ) : (
                            <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary-foreground">
                              Thêm vào lịch trình
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Price summary */}
        <div className="mt-8 p-4 border-t border-neutral-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 className="font-medium mb-1">Tổng chi phí tạm tính</h3>
              <p className="text-sm text-neutral-600">
                Bao gồm phương tiện, lưu trú và {selectedAttractions.length} điểm tham quan
              </p>
            </div>
            <div className="text-2xl font-bold text-primary mt-2 md:mt-0">
              {totalPrice.toLocaleString()}₫
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <div className="flex justify-between p-6 pt-0">
        <Button 
          variant="outline"
          onClick={handleBack}
          className="px-4 py-2"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </Button>
        
        <Button 
          onClick={handleContinue}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-2"
        >
          Tiếp tục
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
