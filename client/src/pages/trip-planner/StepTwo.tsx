import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface TransportationOption {
  id: number;
  type_id: number;
  provider: string;
  origin_id: number;
  destination_id: number;
  departure_time: string;
  arrival_time: string;
  duration: string;
  price: number;
  is_recommended: boolean;
  price_difference: number;
  features: string[];
}

interface Accommodation {
  id: number;
  name: string;
  location_id: number;
  address: string;
  type_id: number;
  rating: number;
  price_per_night: number;
  is_recommended: boolean;
  price_difference: number;
  image_url: string;
  features: string[];
}

export default function StepTwo() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const [totalPrice, setTotalPrice] = useState<number>(0);
  
  // Get origin and destination to display in summary
  const { data: originLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.originId}`],
    enabled: !!tripData.originId,
  });
  
  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });
  
  // Get transportation options
  const { data: transportationOptions, isLoading: isLoadingTransport } = useQuery({
    queryKey: [`/api/transportation-options?originId=${tripData.originId}&destinationId=${tripData.destinationId}`],
    enabled: !!(tripData.originId && tripData.destinationId),
  });
  
  // Get accommodations
  const { data: accommodations, isLoading: isLoadingAccommodations } = useQuery({
    queryKey: [`/api/accommodations?locationId=${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });
  
  // Selected options
  const [selectedTransportation, setSelectedTransportation] = useState<number | undefined>(
    tripData.selectedTransportation
  );
  
  const [selectedAccommodations, setSelectedAccommodations] = useState<number[]>(
    tripData.selectedAccommodations || []
  );

  // Calculate total price
  useEffect(() => {
    let price = 0;
    
    // Add transportation price
    if (selectedTransportation && transportationOptions) {
      const transportOption = transportationOptions.find((option: TransportationOption) => option.id === selectedTransportation);
      if (transportOption) {
        price += Number(transportOption.price);
      }
    }
    
    // Add accommodation prices
    if (selectedAccommodations.length > 0 && accommodations && tripData.accommodations) {
      selectedAccommodations.forEach((accomId) => {
        const accommodation = accommodations.find((a: Accommodation) => a.id === accomId);
        if (accommodation) {
          // Find matching trip accommodation to get number of nights
          const tripAccommodation = tripData.accommodations?.find(
            (_, index) => index === selectedAccommodations.indexOf(accomId)
          );
          
          if (tripAccommodation && tripAccommodation.checkIn && tripAccommodation.checkOut) {
            const checkIn = new Date(tripAccommodation.checkIn);
            const checkOut = new Date(tripAccommodation.checkOut);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            price += Number(accommodation.price_per_night) * nights;
          }
        }
      });
    }
    
    setTotalPrice(price);
  }, [selectedTransportation, selectedAccommodations, transportationOptions, accommodations, tripData.accommodations]);

  // Handle transportation selection
  const handleSelectTransportation = (transportId: number) => {
    setSelectedTransportation(transportId);
  };

  // Handle accommodation selection
  const handleSelectAccommodation = (accomId: number, index: number) => {
    setSelectedAccommodations((prev) => {
      const newSelection = [...prev];
      newSelection[index] = accomId;
      return newSelection;
    });
  };

  // Format date function
  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (tripData.startDate && tripData.endDate) {
      const start = new Date(tripData.startDate);
      const end = new Date(tripData.endDate);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  // Handle continue button click
  const handleContinue = () => {
    // Update trip data with selections
    updateTripData({
      selectedTransportation,
      selectedAccommodations,
      totalPrice
    });
    
    // Go to next step
    setCurrentStep(3);
  };

  // Handle back button click
  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">Bước 2: Chọn phương tiện và khách sạn lưu trú</h2>
        
        {/* Current selection summary */}
        <div className="bg-neutral-100 p-4 rounded-lg mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center mb-2 md:mb-0">
              <svg className="w-5 h-5 text-primary mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">{originLocation?.name || "Đang tải..."}</span>
              <svg className="w-5 h-5 mx-2 text-neutral-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M14 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">{destinationLocation?.name || "Đang tải..."}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-primary mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>
                {tripData.startDate && formatDate(new Date(tripData.startDate))} - {tripData.endDate && formatDate(new Date(tripData.endDate))}
              </span>
              <Badge variant="outline" className="ml-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-200">
                {getTripDuration()} ngày
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Transportation section */}
        <div className="mb-8">
          <h3 className="font-medium text-lg mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 17H16M8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17M8 17L8.23874 16.1422C8.7322 14.4673 10.299 13.3333 12.0625 13.3333H12.9375C14.701 13.3333 16.2678 14.4673 16.7613 16.1422L17 17M16 17C16 18.1046 16.8954 19 18 19C19.1046 19 20 18.1046 20 17M20 10L19.38 6.54891C19.1556 5.15299 17.9617 4.12567 16.5481 4.12567H15C15 3.50324 14.4968 3 13.8743 3H11.1257C10.5032 3 10 3.50324 10 4.12567H7.45185C6.03835 4.12567 4.84361 5.15299 4.62003 6.54891L4 10M20 10H4M20 10V12C20 12.5523 19.5523 13 19 13H18C17.4477 13 17 12.5523 17 12V11H7V12C7 12.5523 6.55228 13 6 13H5C4.44772 13 4 12.5523 4 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Phương tiện di chuyển
          </h3>
          
          {isLoadingTransport ? (
            <div className="py-10 text-center">
              <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transportationOptions && transportationOptions.map((option: TransportationOption) => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all shadow-hover ${
                    selectedTransportation === option.id ? 'border-primary bg-blue-50' : 'border-neutral-300 bg-white'
                  }`}
                  onClick={() => handleSelectTransportation(option.id)}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg className={`w-6 h-6 ${selectedTransportation === option.id ? 'text-primary' : 'text-neutral-700'} mr-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 012-2h1.945M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2h-4l-2-2H9L7 6H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h4 className="font-medium">{option.provider}</h4>
                      </div>
                      <div className="mt-3 mb-2 flex text-sm text-neutral-600">
                        <div className="mr-6">
                          <div className="font-medium">{option.departure_time}</div>
                          <div className="text-xs">{originLocation?.name?.substring(0, 3).toUpperCase()}</div>
                        </div>
                        <div className="flex flex-col items-center mx-2">
                          <div className="text-xs">{option.duration}</div>
                          <div className="border-t border-neutral-400 w-16 my-1"></div>
                          <div className="text-xs">{option.features[0]}</div>
                        </div>
                        <div>
                          <div className="font-medium">{option.arrival_time}</div>
                          <div className="text-xs">{destinationLocation?.name?.substring(0, 3).toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                      {option.is_recommended && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Đề xuất
                        </Badge>
                      )}
                      {option.price_difference > 0 && (
                        <div className="text-red-500 font-medium">+{option.price_difference.toLocaleString()}₫</div>
                      )}
                      {option.price_difference < 0 && (
                        <div className="text-orange-500 font-medium">{option.price_difference.toLocaleString()}₫</div>
                      )}
                      {option.price_difference === 0 && (
                        <div className="text-primary font-medium">{option.price.toLocaleString()}₫</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Accommodation section */}
        <div>
          <h3 className="font-medium text-lg mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21h18M3 10h18M12 3v7m-9 9h6v-9H3v9zm12 0h6v-9h-6v9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Khách sạn lưu trú
          </h3>
          
          {isLoadingAccommodations ? (
            <div className="py-10 text-center">
              <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div>
              {tripData.accommodations && tripData.accommodations.map((tripAccom, index) => (
                <div key={index} className="mb-6">
                  <h4 className="font-medium mb-3 pb-1 border-b border-neutral-200">
                    Khách sạn {index + 1}: {tripAccom.location === "center" ? "Trung tâm" : 
                                          tripAccom.location === "beach" ? "Bãi biển" : 
                                          tripAccom.location === "mountain" ? "Vùng núi" : 
                                          tripAccom.location}
                    {tripAccom.checkIn && tripAccom.checkOut && (
                      <span className="text-sm font-normal text-neutral-500 ml-2">
                        ({formatDate(new Date(tripAccom.checkIn))} - {formatDate(new Date(tripAccom.checkOut))})
                      </span>
                    )}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {accommodations && accommodations.map((accommodation: Accommodation) => {
                      // Calculate nights for this accommodation
                      let nights = 0;
                      if (tripAccom.checkIn && tripAccom.checkOut) {
                        const checkIn = new Date(tripAccom.checkIn);
                        const checkOut = new Date(tripAccom.checkOut);
                        nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                      }
                      
                      return (
                        <div 
                          key={accommodation.id}
                          className={`border rounded-lg overflow-hidden cursor-pointer transition-all shadow-hover ${
                            selectedAccommodations[index] === accommodation.id ? 'border-primary' : 'border-neutral-300'
                          }`}
                          onClick={() => handleSelectAccommodation(accommodation.id, index)}
                        >
                          <div className="relative h-48">
                            <img 
                              src={accommodation.image_url} 
                              alt={accommodation.name} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-sm">
                              <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              {accommodation.rating}
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium">{accommodation.name}</h4>
                              {accommodation.is_recommended && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Đề xuất
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-neutral-600 mb-3">
                              <svg className="w-4 h-4 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{accommodation.address}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {accommodation.features.map((feature, i) => (
                                <Badge key={i} variant="outline" className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-sm text-neutral-600">{nights} đêm</div>
                                {accommodation.price_difference === 0 ? (
                                  <div className="text-primary font-medium">
                                    {(accommodation.price_per_night * nights).toLocaleString()}₫
                                  </div>
                                ) : accommodation.price_difference < 0 ? (
                                  <div className="text-orange-500 font-medium">
                                    {accommodation.price_difference.toLocaleString()}₫
                                  </div>
                                ) : (
                                  <div className="text-red-500 font-medium">
                                    +{accommodation.price_difference.toLocaleString()}₫
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                                Xem chi tiết
                                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Price summary */}
        <div className="mt-8 p-4 border-t border-neutral-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h3 className="font-medium mb-1">Tổng chi phí tạm tính</h3>
              <p className="text-sm text-neutral-600">Cập nhật theo lựa chọn của bạn</p>
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
          disabled={!selectedTransportation || selectedAccommodations.some(id => !id)}
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
