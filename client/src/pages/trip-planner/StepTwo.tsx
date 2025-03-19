import { useEffect, useState } from "react";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TransportationOption {
  id: number;
  type_id: number;
  origin_id: number;
  destination_id: number;
  provider: string;
  // Thông tin chiều đi
  departure_flight_number: string;
  departure_time: string;
  departure_arrival_time: string;
  departure_baggage: string;
  // Thông tin chiều về
  return_flight_number: string;
  return_time: string;
  return_arrival_time: string;
  return_baggage: string;
  price: number;
  is_recommended: boolean;
  price_difference: number;
  features: string[];
}

interface DepartureOption {
  id: number;
  type_id: number;
  provider: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  baggage: string;
  origin_id: number;
  destination_id: number;
  price: number;
  is_recommended: boolean;
}

interface ReturnOption {
  id: number;
  type_id: number;
  provider: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  baggage: string;
  origin_id: number;
  destination_id: number;
  price: number;
  is_recommended: boolean;
}

interface Accommodation {
  id: number;
  name: string;
  location_id: number;
  address: string;
  type_id: number;
  rating: number;
  price_per_night: number;
  image_url: string;
  features: string[];
}

interface AccommodationInfo {
  id: number;
  location: number; // ID của location
  checkIn: Date | undefined;
  checkOut: Date | undefined;
}

export default function StepTwo() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();

  // Tổng chi phí tạm tính (vẫn dùng cho phần chỗ ở)
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);

  // Lựa chọn chuyến bay hiện tại
  const [selectedDepartureOption, setSelectedDepartureOption] = useState<number | null>(
    tripData.selectedDepartureOption || null
  );
  const [selectedReturnOption, setSelectedReturnOption] = useState<number | null>(
    tripData.selectedReturnOption || null
  );
  // Các lựa chọn chỗ ở
  const [selectedAccommodations, setSelectedAccommodations] = useState<{ [key: number]: number | null }>(
    tripData.selectedAccommodations || {}
  );

  // State điều khiển hiển thị toàn bộ lựa chọn hay ẩn (cho từng cột)
  const [showAllDepartures, setShowAllDepartures] = useState(false);
  const [showAllReturns, setShowAllReturns] = useState(false);

  // Define Location interface
  interface Location {
    id: number;
    name: string;
    type: string;
    description?: string;
  }
  
  // Lấy thông tin location
  const { data: originLocation = { id: 0, name: "Unknown", type: "origin" } } = useQuery<Location>({
    queryKey: [`/api/locations/${tripData.origin_id}`],
    enabled: !!tripData.origin_id,
  });
  const { data: destinationLocation = { id: 0, name: "Unknown", type: "destination" } } = useQuery<Location>({
    queryKey: [`/api/locations/${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
  });

  // Lấy danh sách TransportationOption (dữ liệu từ storage hoặc file)
  const {
    data: transportationOptions,
    isLoading: isLoadingTransport,
    error: transportError,
  } = useQuery<TransportationOption[]>({
    queryKey: [
      `/api/transportation-options?originId=${tripData.origin_id}&destinationId=${tripData.destination_id}&startDate=${tripData.start_date}`
    ],
    enabled: !!(tripData.origin_id && tripData.destination_id && tripData.start_date),
  });

  // Lấy danh sách chỗ ở cho tất cả địa điểm
  const [accommodationsByLocation, setAccommodationsByLocation] = useState<{[key: number]: Accommodation[]}>({});
  const [isLoadingAccommodations, setIsLoadingAccommodations] = useState<boolean>(true);
  const [accommodationError, setAccommodationError] = useState<any>(null);
  
  // Tạo các query để lấy danh sách chỗ ở cho mỗi địa điểm
  useEffect(() => {
    if (!tripData.accommodations || tripData.accommodations.length === 0) return;
    
    const fetchAccommodations = async () => {
      setIsLoadingAccommodations(true);
      const results: {[key: number]: Accommodation[]} = {};
      
      try {
        // Lấy danh sách chỗ ở cho mỗi địa điểm
        for (const accom of tripData.accommodations) {
          if (accom.location) {
            const response = await fetch(`/api/accommodations?locationId=${accom.location}`);
            if (!response.ok) throw new Error(`Không thể lấy chỗ ở cho địa điểm ${accom.location}`);
            const data = await response.json();
            results[accom.location] = data;
          }
        }
        
        setAccommodationsByLocation(results);
        setAccommodationError(null);
      } catch (error) {
        console.error("Lỗi khi lấy chỗ ở:", error);
        setAccommodationError(error);
      } finally {
        setIsLoadingAccommodations(false);
      }
    };
    
    fetchAccommodations();
  }, [tripData.accommodations]);

  // Phân tách và chuyển đổi các option thành 2 mảng: chiều đi và chiều về
  const [departureOptions, setDepartureOptions] = useState<DepartureOption[]>([]);
  const [returnOptions, setReturnOptions] = useState<ReturnOption[]>([]);

  useEffect(() => {
    if (!transportationOptions) return;

    // Chuyển đổi mỗi TransportationOption thành 2 option:
    const departures: DepartureOption[] = transportationOptions.map(option => ({
      id: option.id * 100, // Tạo ID riêng biệt
      type_id: option.type_id,
      provider: option.provider,
      flight_number: option.departure_flight_number,
      departure_time: option.departure_time,
      arrival_time: option.departure_arrival_time,
      baggage: option.departure_baggage,
      origin_id: option.origin_id,
      destination_id: option.destination_id,
      price: option.price / 2, // Giá vé chia đôi (vé khứ hồi)
      is_recommended: option.is_recommended,
    }));

    const returns: ReturnOption[] = transportationOptions.map(option => ({
      id: option.id * 100 + 1, // Tạo ID riêng biệt
      type_id: option.type_id,
      provider: option.provider,
      flight_number: option.return_flight_number,
      departure_time: option.return_time,
      arrival_time: option.return_arrival_time,
      baggage: option.return_baggage,
      origin_id: option.destination_id, // Đảo chiều
      destination_id: option.origin_id,
      price: option.price / 2,
      is_recommended: option.is_recommended,
    }));

    // Sắp xếp theo giá tăng dần (rẻ nhất lên trước)
    const sortedDepartures = departures.sort((a, b) => a.price - b.price);
    const sortedReturns = returns.sort((a, b) => a.price - b.price);

    setDepartureOptions(sortedDepartures);
    setReturnOptions(sortedReturns);

    // Nếu chưa có lựa chọn, mặc định chọn chuyến rẻ nhất (là phần tử đầu tiên)
    if (!selectedDepartureOption && sortedDepartures.length > 0) {
      setSelectedDepartureOption(sortedDepartures[0].id);
    }
    if (!selectedReturnOption && sortedReturns.length > 0) {
      setSelectedReturnOption(sortedReturns[0].id);
    }
  }, [transportationOptions, selectedDepartureOption, selectedReturnOption]);

  // Lấy tất cả các chỗ ở từ tất cả các địa điểm
  const allAccommodations = Object.values(accommodationsByLocation).flat();
  
  // Sắp xếp chỗ ở: rẻ nhất lên trước
  const sortedAccommodations = allAccommodations.length > 0
    ? [...allAccommodations].sort((a, b) => a.price_per_night - b.price_per_night)
    : [];

  // Xác định option rẻ nhất cho chỗ ở
  const cheapestAccommodation = sortedAccommodations.length > 0 ? sortedAccommodations[0] : null;

  // Tính giá cơ sở (basePrice) và tổng chi phí tạm tính (totalPrice)
  useEffect(() => {
    let basePriceValue = 0;
    let currentPriceValue = 0;

    // Tính giá vé máy bay (dựa trên option rẻ nhất cho chiều đi và chiều về)
    if (departureOptions.length > 0 && returnOptions.length > 0) {
      const cheapestDeparture = departureOptions[0];
      const cheapestReturn = returnOptions[0];
      basePriceValue += cheapestDeparture.price + cheapestReturn.price;
      const selectedDeparture = departureOptions.find(o => o.id === selectedDepartureOption);
      const selectedReturn = returnOptions.find(o => o.id === selectedReturnOption);
      currentPriceValue += selectedDeparture ? selectedDeparture.price : 0;
      currentPriceValue += selectedReturn ? selectedReturn.price : 0;
    }

    // Tính giá chỗ ở
    if (cheapestAccommodation && tripData.accommodations) {
      tripData.accommodations.forEach((tripAccom: AccommodationInfo) => {
        if (tripAccom.checkIn && tripAccom.checkOut) {
          const nights = Math.ceil(
            (new Date(tripAccom.checkOut).getTime() - new Date(tripAccom.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          
          // Tính giá cơ bản với chỗ ở rẻ nhất
          basePriceValue += cheapestAccommodation.price_per_night * nights;
          
          // Tìm accommodation được chọn cho điểm dừng này
          const accommodationId = selectedAccommodations[tripAccom.id];
          
          // Tìm chỗ ở được chọn trong toàn bộ danh sách
          const selectedAccommodation = sortedAccommodations.find(a => a.id === accommodationId);
          
          // Tính giá hiện tại
          currentPriceValue += selectedAccommodation
            ? selectedAccommodation.price_per_night * nights
            : cheapestAccommodation.price_per_night * nights;
        }
      });
    }

    setBasePrice(basePriceValue);
    setTotalPrice(currentPriceValue);
  }, [
    selectedDepartureOption,
    selectedReturnOption,
    selectedAccommodations,
    departureOptions,
    returnOptions,
    sortedAccommodations,
    tripData.accommodations,
    cheapestAccommodation
  ]);

  // Xử lý chọn chuyến bay chiều đi
  const handleSelectDeparture = (id: number) => {
    setSelectedDepartureOption(id);
  };

  // Xử lý chọn chuyến bay chiều về
  const handleSelectReturn = (id: number) => {
    setSelectedReturnOption(id);
  };

  // Xử lý chọn chỗ ở
  const handleSelectAccommodation = (accommodationId: number, tripAccommodationId: number) => {
    setSelectedAccommodations(prev => ({
      ...prev,
      [tripAccommodationId]: accommodationId,
    }));
  };

  // Nút Quay lại
  const handleBack = () => {
    setCurrentStep(1);
  };

  // Nút Tiếp tục
  const handleContinue = () => {
    if (!selectedDepartureOption) {
      alert("Vui lòng chọn chuyến bay đi");
      return;
    }
    if (!selectedReturnOption) {
      alert("Vui lòng chọn chuyến bay về");
      return;
    }
    if (tripData.accommodations && Object.keys(selectedAccommodations).length < tripData.accommodations.length) {
      alert("Vui lòng chọn đầy đủ chỗ ở cho tất cả các điểm dừng");
      return;
    }
    updateTripData({
      selectedDepartureOption,
      selectedReturnOption,
      selectedAccommodations,
      totalPrice,
    });
    setCurrentStep(3);
  };

  // Khởi tạo lựa chọn chỗ ở mặc định nếu chưa có
  useEffect(() => {
    if (sortedAccommodations.length > 0 && tripData.accommodations && Object.keys(selectedAccommodations).length === 0) {
      const initAccom: { [key: number]: number | null } = {};
      tripData.accommodations.forEach((tripAccom: AccommodationInfo) => {
        initAccom[tripAccom.id] = sortedAccommodations[0].id;
      });
      setSelectedAccommodations(initAccom);
    }
  }, [sortedAccommodations, tripData.accommodations, selectedAccommodations]);

  if (isLoadingTransport || isLoadingAccommodations) {
    return <div>Đang tải...</div>;
  }
  if (transportError) {
    return <div>Lỗi khi tải phương tiện: {(transportError as any).message || "Không thể lấy dữ liệu."}</div>;
  }
  if (accommodationError) {
    return <div>Lỗi khi tải chỗ ở: {(accommodationError as any).message || "Không thể lấy dữ liệu."}</div>;
  }
  if (!tripData.origin_id || !tripData.destination_id) {
    return <div>Vui lòng chọn điểm đi và đến ở bước trước!</div>;
  }
  if (!tripData.accommodations || tripData.accommodations.length === 0) {
    return <div>Chưa có thông tin chỗ ở, vui lòng thêm ở bước trước!</div>;
  }

  return (
    <div className="space-y-6">
      {/* PHẦN TỔNG CHI PHÍ */}
      <div className="bg-sky-50 p-4 rounded-lg mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Tổng chi phí tạm tính</h2>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Bao gồm phương tiện, lưu trú</div>
          <div className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()}đ</div>
        </div>
        {totalPrice !== basePrice && (
          <div className="text-right text-sm font-medium text-primary mt-1">
            {totalPrice > basePrice 
              ? `+${(totalPrice - basePrice).toLocaleString()}đ so với gói tiết kiệm` 
              : `Tiết kiệm ${(basePrice - totalPrice).toLocaleString()}đ`}
          </div>
        )}
      </div>

      {/* CHIA GIAO DIỆN 2 CỘT: CHIỀU ĐI & CHIỀU VỀ */}
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Cột CHIỀU ĐI */}
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-4">
            Chiều đi: {originLocation?.name} → {destinationLocation?.name}
          </h3>
          {/* Hiển thị option được chọn hoặc tất cả nếu "Xem thêm" */}
          <div className="space-y-4">
            {(showAllDepartures ? departureOptions : departureOptions.filter(o => o.id === selectedDepartureOption))
              .map((option) => {
                // Option rẻ nhất là phần tử đầu tiên sau khi sắp xếp
                const cheapestOption = departureOptions[0];
                const delta = option.price - cheapestOption.price;
                const isSelected = selectedDepartureOption === option.id;
                const isCheapest = option.id === cheapestOption.id;
                return (
                  <Card
                    key={option.id}
                    onClick={() => handleSelectDeparture(option.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-blue-50"
                    )}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="font-semibold">{option.departure_time}</div>
                            <div className="text-xs text-gray-500">{originLocation?.name}</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-gray-500">{option.flight_number}</div>
                            <div className="relative w-28 h-6 flex items-center">
                              <div className="border-t border-gray-300 w-full"></div>
                              <div className="absolute right-0 text-gray-500">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">{option.provider}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{option.arrival_time}</div>
                            <div className="text-xs text-gray-500">{destinationLocation?.name}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {isSelected && <Badge variant="outline">Đã chọn</Badge>}
                          {isCheapest && <Badge variant="secondary">Đề xuất</Badge>}
                          {delta > 0 && (
                            <span className="text-xs font-medium text-primary">
                              +{delta.toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
          </div>
          {departureOptions.length > 1 && (
            <div className="mt-2">
              <Button variant="link" onClick={() => setShowAllDepartures(!showAllDepartures)}>
                {showAllDepartures ? "Ẩn bớt" : "Xem thêm"}
              </Button>
            </div>
          )}
        </div>

        {/* Cột CHIỀU VỀ */}
        <div className="flex-1 mt-6 md:mt-0">
          <h3 className="text-lg font-medium mb-4">
            Chiều về: {destinationLocation?.name} → {originLocation?.name}
          </h3>
          <div className="space-y-4">
            {(showAllReturns ? returnOptions : returnOptions.filter(o => o.id === selectedReturnOption))
              .map((option) => {
                const cheapestOption = returnOptions[0];
                const delta = option.price - cheapestOption.price;
                const isSelected = selectedReturnOption === option.id;
                const isCheapest = option.id === cheapestOption.id;
                return (
                  <Card
                    key={option.id}
                    onClick={() => handleSelectReturn(option.id)}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary bg-blue-50"
                    )}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="font-semibold">{option.departure_time}</div>
                            <div className="text-xs text-gray-500">{destinationLocation?.name}</div>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-gray-500">{option.flight_number}</div>
                            <div className="relative w-28 h-6 flex items-center">
                              <div className="border-t border-gray-300 w-full"></div>
                              <div className="absolute right-0 text-gray-500">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">{option.provider}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{option.arrival_time}</div>
                            <div className="text-xs text-gray-500">{originLocation?.name}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {isSelected && <Badge variant="outline">Đã chọn</Badge>}
                          {isCheapest && <Badge variant="secondary">Đề xuất</Badge>}
                          {delta > 0 && (
                            <span className="text-xs font-medium text-primary">
                              +{delta.toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
          </div>
          {returnOptions.length > 1 && (
            <div className="mt-2">
              <Button variant="link" onClick={() => setShowAllReturns(!showAllReturns)}>
                {showAllReturns ? "Ẩn bớt" : "Xem thêm"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* PHẦN CHỌN CHỖ Ở */}
      <div>
        <h3 className="text-lg font-medium mb-4">Chọn chỗ ở</h3>
        {tripData.accommodations && tripData.accommodations.map((tripAccom: AccommodationInfo) => {
          // Lấy danh sách chỗ ở cho địa điểm này
          const accommodationsForThisLocation = accommodationsByLocation[tripAccom.location] || [];
          
          // Lấy thông tin địa điểm từ ID
          const locationName = (() => {
            // Tạo Map của các location đã biết
            const knownLocations: {[key: number]: string} = {
              1: "Hà Nội",
              2: "Hồ Chí Minh",
              3: "Phú Quốc",
              4: "Đà Nẵng",
              5: "Đà Lạt",
              6: "Nha Trang",
              7: "Hạ Long",
            };
            return knownLocations[tripAccom.location] || "Đang tải...";
          })();
          
          return (
            <div key={tripAccom.id} className="mb-6">
              <h4 className="font-medium mb-2">
                Chỗ ở tại {locationName}{" "}
                {tripAccom.checkIn && tripAccom.checkOut && (
                  <span className="text-sm text-muted-foreground">
                    ({new Date(tripAccom.checkIn).toLocaleDateString()} - {new Date(tripAccom.checkOut).toLocaleDateString()})
                  </span>
                )}
              </h4>
              {accommodationsForThisLocation.length === 0 ? (
                <p>Không có chỗ ở khả dụng tại địa điểm này.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {accommodationsForThisLocation.map((accom) => {
                    let nights = 1;
                    if (tripAccom.checkIn && tripAccom.checkOut) {
                      nights = Math.ceil(
                        (new Date(tripAccom.checkOut).getTime() - new Date(tripAccom.checkIn).getTime()) /
                        (1000 * 60 * 60 * 24)
                      );
                    }
                    const delta = cheapestAccommodation
                      ? (accom.price_per_night - cheapestAccommodation.price_per_night) * nights
                      : 0;
                    const isSelected = selectedAccommodations[tripAccom.id] === accom.id;
                    return (
                      <Card
                        key={accom.id}
                        onClick={() => handleSelectAccommodation(accom.id, tripAccom.id)}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-primary bg-blue-50"
                        )}
                      >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={accom.image_url || "https://placehold.co/100"}
                            alt={accom.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">{accom.name}</h5>
                              {isSelected && (
                                <Badge variant="outline">Đã chọn</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{accom.address}</p>
                            <div className="flex items-center mt-1">
                              <div className="text-yellow-500 mr-1">★</div>
                              <span className="text-sm">{accom.rating}</span>
                            </div>
                            {delta > 0 && (
                              <p className="text-sm font-medium text-primary mt-1">
                                +{delta.toLocaleString()}đ
                              </p>
                            )}
                            {delta < 0 && (
                              <p className="text-sm font-medium text-green-600 mt-1">
                                {delta.toLocaleString()}đ
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )})}
      </div>

      {/* NÚT QUAY LẠI / TIẾP TỤC */}
      <div className="flex justify-between p-6 pt-4">
        <Button variant="outline" onClick={handleBack} className="px-4 py-2">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </Button>
        <Button onClick={handleContinue} className="bg-primary hover:bg-blue-700 text-white px-6 py-2">
          Tiếp tục
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
