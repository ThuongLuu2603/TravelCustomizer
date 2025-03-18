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
  provider: string;
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

interface TripAccommodation {
  id: number;
  trip_id: number;
  checkIn?: string;
  checkOut?: string;
  location?: string;
}

export default function StepTwo() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [selectedTransportation, setSelectedTransportation] = useState<number | null>(
    tripData.selectedTransportation || null
  );
  const [selectedAccommodations, setSelectedAccommodations] = useState<{ [key: number]: number | null }>(
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
  const { data: transportationOptions, isLoading: isLoadingTransport, error: transportError } = useQuery<TransportationOption[]>({
    queryKey: [`/api/transportation-options?originId=${tripData.originId}&destinationId=${tripData.destinationId}&startDate=${tripData.startDate}`],
    enabled: !!(tripData.originId && tripData.destinationId && tripData.startDate),
  });

  // Get accommodations
  const { data: accommodations, isLoading: isLoadingAccommodations, error: accommodationError } = useQuery<Accommodation[]>({
    queryKey: [`/api/accommodations?locationId=${tripData.destinationId}&checkIn=${tripData.accommodations?.[0]?.checkIn}`],
    enabled: !!(tripData.destinationId && tripData.accommodations?.[0]?.checkIn),
  });

  // Debug: Log dữ liệu
  useEffect(() => {
    console.log("tripData:", tripData);
    console.log("transportationOptions:", transportationOptions);
    console.log("accommodations:", accommodations);
    console.log("transportError:", transportError);
    console.log("accommodationError:", accommodationError);
  }, [tripData, transportationOptions, accommodations, transportError, accommodationError]);

  // Calculate total price
  useEffect(() => {
    let price = 0;

    if (selectedTransportation && transportationOptions) {
      const transport = transportationOptions.find(t => t.id === selectedTransportation);
      if (transport) price += transport.price;
    }

    if (accommodations && tripData.accommodations) {
      tripData.accommodations.forEach((tripAccom: TripAccommodation) => {
        const accommodationId = selectedAccommodations[tripAccom.id];
        const accommodation = accommodations.find(a => a.id === accommodationId);
        if (accommodation && tripAccom.checkIn && tripAccom.checkOut) {
          const nights = Math.ceil(
            (new Date(tripAccom.checkOut).getTime() - new Date(tripAccom.checkIn).getTime()) / (1000 * 60 * 60 * 24)
          );
          price += accommodation.price_per_night * nights;
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
      [tripAccommodationId]: accommodationId,
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedTransportation) {
      alert("Vui lòng chọn phương tiện di chuyển");
      return;
    }

    if (tripData.accommodations && Object.keys(selectedAccommodations).length < tripData.accommodations.length) {
      alert("Vui lòng chọn đầy đủ chỗ ở cho tất cả các điểm dừng");
      return;
    }

    updateTripData({
      selectedTransportation,
      selectedAccommodations,
      totalPrice,
    });
    setCurrentStep(3);
  };

  // Initialize selections
  useEffect(() => {
    if (transportationOptions?.length > 0 && !selectedTransportation) {
      const recommended = transportationOptions.find(t => t.is_recommended)?.id || transportationOptions[0]?.id;
      if (recommended) setSelectedTransportation(recommended);
    }

    if (accommodations?.length > 0 && tripData.accommodations && Object.keys(selectedAccommodations).length === 0) {
      const initialAccommodations: { [key: number]: number | null } = {};
      tripData.accommodations.forEach((tripAccom: TripAccommodation) => {
        const recommended = accommodations.find(a => a.is_recommended)?.id || accommodations[0]?.id;
        initialAccommodations[tripAccom.id] = recommended || null;
      });
      setSelectedAccommodations(initialAccommodations);
    }
  }, [transportationOptions, accommodations, tripData.accommodations]);

  if (isLoadingTransport || isLoadingAccommodations) {
    return <div>Đang tải...</div>;
  }

  if (transportError) {
    return (
      <div>
        Lỗi khi tải phương tiện di chuyển: {(transportError as any).message || "Không thể lấy dữ liệu."}
        <p>Kiểm tra originId: {tripData.originId}, destinationId: {tripData.destinationId}, startDate: {tripData.startDate}</p>
      </div>
    );
  }

  if (accommodationError) {
    return (
      <div>
        Lỗi khi tải chỗ ở: {(accommodationError as any).message || "Không thể lấy dữ liệu."}
        <p>Kiểm tra locationId: {tripData.destinationId}, checkIn: {tripData.accommodations?.[0]?.checkIn}</p>
      </div>
    );
  }

  if (!tripData.originId || !tripData.destinationId) {
    return <div>Vui lòng chọn điểm đi và điểm đến ở bước trước!</div>;
  }

  if (!tripData.accommodations || tripData.accommodations.length === 0) {
    return <div>Chưa có thông tin chỗ ở. Vui lòng thêm chỗ ở ở bước trước!</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">
          Chọn phương tiện di chuyển từ {originLocation?.name || "Đang tải..."} đến {destinationLocation?.name || "Đang tải..."}
        </h3>
        {!transportationOptions || transportationOptions.length === 0 ? (
          <p>Không có phương tiện nào khả dụng cho hành trình này. Kiểm tra originId: {tripData.originId}, destinationId: {tripData.destinationId}, startDate: {tripData.startDate}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transportationOptions.map((option) => (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedTransportation === option.id && "ring-2 ring-primary bg-blue-50"
                )}
                onClick={() => handleSelectTransportation(option.id)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{option.provider}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.departure_time} - {option.arrival_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{option.price.toLocaleString()}đ</p>
                    {option.is_recommended && (
                      <span className="text-sm text-green-600">Đề xuất</span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Chọn chỗ ở</h3>
        {tripData.accommodations.map((tripAccom: TripAccommodation) => (
          <div key={tripAccom.id} className="mb-6">
            <h4 className="font-medium mb-2">
              Chỗ ở {tripAccom.id}
              {tripAccom.checkIn && tripAccom.checkOut && (
                <span className="text-sm text-muted-foreground">
                  {" "}({new Date(tripAccom.checkIn).toLocaleDateString()} - {new Date(tripAccom.checkOut).toLocaleDateString()})
                </span>
              )}
            </h4>
            {!accommodations || accommodations.length === 0 ? (
              <p>Không có chỗ ở nào khả dụng tại điểm đến này. Kiểm tra locationId: {tripData.destinationId}, checkIn: {tripData.accommodations?.[0]?.checkIn}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accommodations.map((accom) => (
                  <Card
                    key={accom.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedAccommodations[tripAccom.id] === accom.id && "ring-2 ring-primary bg-blue-50"
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
                              <span className="text-sm text-green-600">Đề xuất</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-medium">Tổng chi phí tạm tính:</p>
          <p className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}đ</p>
        </div>
        <Button onClick={handleSubmit}>
          Tiếp tục
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
    </div>
  );
}