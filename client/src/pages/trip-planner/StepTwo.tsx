import { useEffect, useState } from "react";
import { useTripContext } from "@/lib/trip-context"; 
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransportationOption {
  id: number;
  type_id: number;
  origin_id: number;
  destination_id: number;
  departure_time: string;
  arrival_time: string;
  price: number;
  operator: string;
  is_recommended: boolean;
  price_difference: number;
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
  const [selectedTransportation, setSelectedTransportation] = useState<number | null>(
    tripData.selectedTransportation || null
  );
  const [selectedAccommodations, setSelectedAccommodations] = useState<{[key: number]: number}>(
    tripData.selectedAccommodations || {}
  );

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

  // Calculate total price
  useEffect(() => {
    let price = 0;

    // Add transportation price
    if (selectedTransportation && transportationOptions) {
      const transport = transportationOptions.find(t => t.id === selectedTransportation);
      if (transport) {
        price += transport.price;
      }
    }

    // Add accommodation prices
    if (selectedAccommodations && accommodations && tripData.accommodations) {
      tripData.accommodations.forEach(accom => {
        const accommodationId = selectedAccommodations[accom.id];
        const accommodation = accommodations.find(a => a.id === accommodationId);
        if (accommodation) {
          price += accommodation.price_per_night;
        }
      });
    }

    setTotalPrice(price);
  }, [selectedTransportation, selectedAccommodations, transportationOptions, accommodations, tripData.accommodations]);

  // Handle selections
  const handleSelectTransportation = (transportId: number) => {
    setSelectedTransportation(transportId);
  };

  const handleSelectAccommodation = (accommodationId: number, tripAccommodationId: number) => {
    setSelectedAccommodations(prev => ({
      ...prev,
      [tripAccommodationId]: accommodationId
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedTransportation) {
      alert("Vui lòng chọn phương tiện di chuyển");
      return;
    }

    if (Object.keys(selectedAccommodations).length < (tripData.accommodations?.length || 0)) {
      alert("Vui lòng chọn đầy đủ chỗ ở");
      return;
    }

    updateTripData({
      selectedTransportation,
      selectedAccommodations,
      totalPrice
    });

    setCurrentStep(3);
  };

  if (isLoadingTransport || isLoadingAccommodations) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Chọn phương tiện di chuyển</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transportationOptions?.map((option) => (
            <Card 
              key={option.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedTransportation === option.id && "ring-2 ring-primary"
              )}
              onClick={() => handleSelectTransportation(option.id)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{option.operator}</h4>
                  <p className="text-sm text-muted-foreground">
                    {option.departure_time} - {option.arrival_time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{option.price.toLocaleString()}đ</p>
                  {option.is_recommended && (
                    <span className="text-sm text-green-600">Recommended</span>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Chọn chỗ ở</h3>
        {tripData.accommodations?.map((tripAccom) => (
          <div key={tripAccom.id} className="mb-6">
            <h4 className="font-medium mb-2">Chỗ ở {tripAccom.id}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accommodations?.map((accom) => (
                <Card
                  key={accom.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedAccommodations[tripAccom.id] === accom.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleSelectAccommodation(accom.id, tripAccom.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={accom.image_url || "https://placehold.co/100"} 
                        alt={accom.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium">{accom.name}</h5>
                        <p className="text-sm text-muted-foreground">{accom.address}</p>
                        <div className="mt-2">
                          <p className="font-medium">{accom.price_per_night.toLocaleString()}đ/đêm</p>
                          {accom.is_recommended && (
                            <span className="text-sm text-green-600">Recommended</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span>Tổng chi phí tạm tính:</span>
          <span className="text-lg font-medium">{totalPrice.toLocaleString()}đ</span>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Quay lại
        </Button>
        <Button onClick={handleSubmit}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}