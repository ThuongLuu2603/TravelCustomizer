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

  // Get location data
  const { data: originLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.originId}`],
    enabled: !!tripData.originId,
  });

  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });

  // Get transportation options
  const { data: transportationOptions, isLoading: isLoadingTransport } = useQuery<TransportationOption[]>({
    queryKey: [`/api/transportation-options?originId=${tripData.originId}&destinationId=${tripData.destinationId}`],
    enabled: !!(tripData.originId && tripData.destinationId),
  });

  // Get accommodations
  const { data: accommodations, isLoading: isLoadingAccommodations } = useQuery<Accommodation[]>({
    queryKey: [`/api/accommodations?locationId=${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });

  // Initialize selected options
  const [selectedTransportation, setSelectedTransportation] = useState<number | undefined>(() => {
    const saved = tripData.selectedTransportation;
    const recommended = transportationOptions?.find(opt => opt.is_recommended)?.id;
    return saved && transportationOptions?.some(opt => opt.id === saved) ? saved : recommended;
  });

  const [selectedAccommodations, setSelectedAccommodations] = useState<(number | undefined)[]>(() => {
    const saved = tripData.selectedAccommodations || [];
    const recommended = accommodations?.filter(acc => acc.is_recommended).map(acc => acc.id) || [];
    return tripData.accommodations?.map((_, index) => 
      saved[index] && accommodations?.some(acc => acc.id === saved[index]) ? saved[index] : recommended[index]
    ) || [];
  });

  // Calculate total price
  useEffect(() => {
    let price = 0;

    // Calculate transportation cost
    const transport = transportationOptions?.find(opt => opt.id === selectedTransportation);
    if (transport) {
      price += Number(transport.price);
    }

    // Calculate accommodation cost
    selectedAccommodations.forEach((accomId, index) => {
      const accom = accommodations?.find(a => a.id === accomId);
      if (accom && tripData.accommodations?.[index]) {
        const { checkIn, checkOut } = tripData.accommodations[index];
        if (checkIn && checkOut) {
          const nights = Math.ceil(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          price += Number(accom.price_per_night) * nights;
        }
      }
    });

    setTotalPrice(price);
  }, [selectedTransportation, selectedAccommodations, transportationOptions, accommodations, tripData.accommodations]);

    // Calculate accommodation costs
    if (accommodations && tripData.accommodations) {
      selectedAccommodations.forEach((accomId, index) => {
        const accommodation = accommodations.find(a => a.id === accomId);
        if (accommodation && tripData.accommodations[index]) {
          const { checkIn, checkOut } = tripData.accommodations[index];
          if (checkIn && checkOut) {
            const nights = Math.ceil(
              (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
            );
            price += accommodation.price_per_night * nights;
          }
        }
      });
    }

    setTotalPrice(price);
  }, [selectedTransportation, selectedAccommodations, transportationOptions, accommodations, tripData.accommodations]);

  // Handle selections
  const handleSelectTransportation = (transportId: number) => {
    setSelectedTransportation(transportId);
  };

  const handleSelectAccommodation = (accomId: number, index: number) => {
    setSelectedAccommodations(prev => {
      const newSelection = [...prev];
      newSelection[index] = accomId;
      return newSelection;
    });
  };

  // Utility functions
  const formatDate = (date: Date) => format(date, "dd/MM/yyyy", { locale: vi });

  const getTripDuration = () => {
    if (tripData.startDate && tripData.endDate) {
      return Math.ceil(
        (new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
    }
    return 0;
  };

  // Navigation handlers
  const handleContinue = () => {
    updateTripData({
      selectedTransportation,
      selectedAccommodations: selectedAccommodations.filter(id => id !== undefined) as number[],
      totalPrice
    });
    setCurrentStep(3);
  };

  const handleBack = () => setCurrentStep(1);

  // Wait until data is loaded before setting initial selections
  useEffect(() => {
    if (transportationOptions && !selectedTransportation) {
      setSelectedTransportation(
        tripData.selectedTransportation || transportationOptions.find(opt => opt.is_recommended)?.id
      );
    }

    if (accommodations && selectedAccommodations.length === 0 && tripData.accommodations) {
      setSelectedAccommodations(
        tripData.accommodations.map((_, index) => 
          tripData.selectedAccommodations?.[index] || 
          accommodations.find(acc => acc.is_recommended)?.id
        )
      );
    }
  }, [transportationOptions, accommodations, tripData, selectedTransportation, selectedAccommodations]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">
          Bước 2: Chọn phương tiện và khách sạn lưu trú
        </h2>

        {/* Trip Summary */}
        <div className="bg-neutral-100 p-4 rounded-lg mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center mb-2 md:mb-0">
              <span className="font-medium">{originLocation?.name || "Đang tải..."}</span>
              <svg className="w-5 h-5 mx-2 text-neutral-600" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M14 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">{destinationLocation?.name || "Đang tải..."}</span>
            </div>
            <div className="flex items-center">
              <span>
                {tripData.startDate && formatDate(new Date(tripData.startDate))} - 
                {tripData.endDate && formatDate(new Date(tripData.endDate))}
              </span>
              <Badge variant="outline" className="ml-2">
                {getTripDuration()} ngày
              </Badge>
            </div>
          </div>
        </div>

        {/* Transportation Section */}
        <div className="mb-8">
          <h3 className="font-medium text-lg mb-4">Phương tiện di chuyển</h3>
          {isLoadingTransport ? (
            <div className="py-10 text-center">Đang tải...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {transportationOptions?.map(option => (
                <div 
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    selectedTransportation === option.id ? 'border-primary bg-blue-50' : 'border-neutral-300'
                  }`}
                  onClick={() => handleSelectTransportation(option.id)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium">{option.provider}</h4>
                      <div className="mt-2 text-sm text-neutral-600">
                        <div>{option.departure_time} → {option.arrival_time}</div>
                        <div>{option.duration}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {option.is_recommended && <Badge variant="success">Đề xuất</Badge>}
                      <div className="font-medium">{option.price.toLocaleString()}₫</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accommodation Section */}
        <div>
          <h3 className="font-medium text-lg mb-4">Khách sạn lưu trú</h3>
          {isLoadingAccommodations ? (
            <div className="py-10 text-center">Đang tải...</div>
          ) : (
            tripData.accommodations?.map((tripAccom, index) => {
              const accomOptions = accommodations?.filter(a => a.type_id.toString() === tripAccom.location);
              return (
                <div key={index} className="mb-6">
                  <h4 className="font-medium mb-3">
                    Khách sạn {index + 1}: {accomOptions?.[0]?.name || "Chưa chọn"}
                    {tripAccom.checkIn && tripAccom.checkOut && (
                      <span className="text-sm text-neutral-500 ml-2">
                        ({formatDate(new Date(tripAccom.checkIn))} - {formatDate(new Date(tripAccom.checkOut))})
                      </span>
                    )}
                  </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {accommodations?.map(accommodation => {
                    const nights = tripAccom.checkIn && tripAccom.checkOut 
                      ? Math.ceil(
                          (new Date(tripAccom.checkOut).getTime() - new Date(tripAccom.checkIn).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        )
                      : 0;

                    return (
                      <div 
                        key={accommodation.id}
                        className={`border rounded-lg cursor-pointer ${
                          selectedAccommodations[index] === accommodation.id ? 'border-primary' : 'border-neutral-300'
                        }`}
                        onClick={() => handleSelectAccommodation(accommodation.id, index)}
                      >
                        <img 
                          src={accommodation.image_url} 
                          alt={accommodation.name} 
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="p-4">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{accommodation.name}</h4>
                            {accommodation.is_recommended && <Badge variant="success">Đề xuất</Badge>}
                          </div>
                          <div className="text-sm text-neutral-600 mb-2">{accommodation.address}</div>
                          <div className="font-medium">
                            {(accommodation.price_per_night * nights).toLocaleString()}₫ ({nights} đêm)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Price Summary */}
        <div className="mt-8 p-4 border-t">
          <div className="flex justify-between">
            <h3 className="font-medium">Tổng chi phí tạm tính</h3>
            <div className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()}₫
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between p-6 pt-0">
        <Button variant="outline" onClick={handleBack}>
          Quay lại
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!selectedTransportation || selectedAccommodations.some(id => id === undefined)}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}