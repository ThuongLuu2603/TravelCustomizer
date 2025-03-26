



  import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

interface AccommodationInfo {
  id: number;
  location: number;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
}

interface DayInfo {
  date: Date;
  locationId: number;
}

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
  adults: number;
  children: number;
  childrenHeights: string[];
  usageDate: string;
}

export default function StepThree() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const [selectedTab, setSelectedTab] = useState<string>("1");
  const [selectedAttractions, setSelectedAttractions] = useState<DayAttraction[]>(
    tripData.selectedAttractions?.map((attraction: DayAttraction) => ({
      ...attraction,
      adults: attraction.adults ?? tripData.adults ?? 1,
      children: attraction.children ?? tripData.children ?? 0,
      childrenHeights: attraction.childrenHeights ?? Array(attraction.children ?? tripData.children ?? 0).fill("<1m"),
      usageDate: attraction.usageDate,
    })) || []
  );
  const [totalPrice, setTotalPrice] = useState<number>(tripData.totalPrice || 0);
  const [attractionsPrice, setAttractionsPrice] = useState<number>(0);
  const [days, setDays] = useState<DayInfo[]>([]);

  const originQuery = useQuery({
    queryKey: ["originLocation", tripData.origin_id],
    queryFn: async () => {
      const response = await fetch(`/api/locations/${tripData.origin_id}`);
      return response.json();
    },
    enabled: !!tripData.origin_id,
  });

  const destinationQuery = useQuery({
    queryKey: ["destinationLocation", tripData.destination_id],
    queryFn: async () => {
      const response = await fetch(`/api/locations/${tripData.destination_id}`);
      return response.json();
    },
    enabled: !!tripData.destination_id,
  });

  const locationQueries = useQuery({
    queryKey: ["locations", tripData.accommodations?.map(a => a.location)],
    queryFn: async () => {
      const results = await Promise.all(
        (tripData.accommodations || []).map(accom => 
          fetch(`/api/locations/${accom.location}`).then(res => res.json())
        )
      );
      return results;
    },
    enabled: !!tripData.accommodations && tripData.accommodations.length > 0,
  });

  const attractionsQuery = useQuery({
    queryKey: ["attractions", tripData.accommodations?.map(a => a.location)],
    queryFn: async () => {
      const uniqueLocationIds = [...new Set(tripData.accommodations?.map(a => a.location))];
      const results = await Promise.all(
        uniqueLocationIds.map(locationId => 
          fetch(`/api/attractions?locationId=${locationId}`).then(res => res.json())
        )
      );
      return Object.fromEntries(uniqueLocationIds.map((id, idx) => [id, results[idx]]));
    },
    enabled: !!tripData.accommodations && tripData.accommodations.length > 0,
  });

  useEffect(() => {
    if (tripData.accommodations && tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      const dayCount = differenceInDays(end, start) + 1;
      const daysArray: DayInfo[] = [];

      for (let i = 0; i < dayCount; i++) {
        const currentDate = addDays(start, i);
        const activeAccom = tripData.accommodations.find(accom => {
          const checkIn = new Date(accom.checkIn || tripData.start_date);
          const checkOut = new Date(accom.checkOut || tripData.end_date);
          return currentDate >= checkIn && currentDate <= checkOut;
        });
        daysArray.push({
          date: currentDate,
          locationId: activeAccom?.location || tripData.destination_id || 0,
        });
      }
      setDays(daysArray);
    }
  }, [tripData.accommodations, tripData.start_date, tripData.end_date, tripData.destination_id]);

  useEffect(() => {
    // Giá cơ bản (di chuyển + lưu trú) từ StepTwo
    const basePrice = tripData.basePrice || 0;

    // Tính giá các điểm tham quan
    let attractionsCost = 0;
    if (selectedAttractions.length > 0 && attractionsQuery.data) {
      selectedAttractions.forEach((selected) => {
        const locationAttractions = attractionsQuery.data[selected.day <= days.length ? days[selected.day - 1]?.locationId : tripData.destination_id || 0];
        const attraction = locationAttractions?.find((a: Attraction) => a.id === selected.attractionId);
        if (attraction) {
          const adultPrice = Number(attraction.price) * selected.adults;
          let childPrice = 0;
          selected.childrenHeights.forEach((height) => {
            if (height === "<1m") {
              childPrice += 0;
            } else if (height === "1-1m3") {
              childPrice += Number(attraction.price) * 0.5;
            } else if (height === ">1m3") {
              childPrice += Number(attraction.price);
            }
          });
          attractionsCost += adultPrice + childPrice;
        }
      });
    }

    // Cập nhật giá các điểm tham quan
    setAttractionsPrice(attractionsCost);

    // Cập nhật tổng giá
    setTotalPrice(basePrice + attractionsCost);
  }, [selectedAttractions, attractionsQuery.data, tripData.basePrice, days, tripData.destination_id]);

  const selectAttraction = (attractionId: number, day: number) => {
    setSelectedAttractions((prev) => {
      const index = prev.findIndex(
        (item) => item.attractionId === attractionId && item.day === day
      );
      if (index >= 0) {
        return prev;
      } else {
        const usageDate = days[day - 1]?.date.toISOString().split("T")[0];
        const newAttractions = [
          ...prev,
          {
            attractionId,
            day,
            adults: tripData.adults || 1,
            children: tripData.children || 0,
            childrenHeights: Array(tripData.children || 0).fill("<1m"),
            usageDate,
          },
        ];
        console.log("After selecting:", newAttractions);
        return newAttractions;
      }
    });
  };

  const deselectAttraction = (attractionId: number, day: number) => {
    setSelectedAttractions((prev) => {
      const newAttractions = prev.filter(
        (item) => !(item.attractionId === attractionId && item.day === day)
      );
      console.log("After deselecting:", newAttractions);
      return newAttractions;
    });
  };

  const formatDate = (date: Date) => format(date, "EEEE, dd/MM/yyyy", { locale: vi });

  const isAttractionSelected = (attractionId: number, day: number) =>
    selectedAttractions.some((item) => item.attractionId === attractionId && item.day === day);

  const handleContinue = () => {
    if (days.length === 0) {
      console.error("Days array is empty. Cannot proceed.");
      return;
    }

    const updatedAttractions = selectedAttractions.map(attr => {
      const usageDate = days[attr.day - 1]?.date?.toISOString().split("T")[0];
      if (!usageDate) {
        console.warn(`No usageDate for day ${attr.day}. Using fallback date.`);
      }
      return {
        attractionId: attr.attractionId,
        day: attr.day,
        timeSlot: attr.timeSlot,
        adults: attr.adults || (tripData.adults ?? 1),
        children: attr.children || (tripData.children ?? 0),
        childrenHeights: attr.childrenHeights || Array(attr.children || tripData.children || 0).fill("<1m"),
        usageDate: usageDate || tripData.start_date,
      };
    });

    console.log("Saving selectedAttractions to tripData:", updatedAttractions);
    console.log("Current tripData before update:", tripData);

    updateTripData({
      selectedAttractions: updatedAttractions,
      totalPrice: totalPrice,
      attractionsTotalPrice: attractionsPrice,
    });

    console.log("tripData after update:", tripData);

    setCurrentStep(4);
  };

  const handleBack = () => setCurrentStep(2);

  const isLoadingAttractions = attractionsQuery.isLoading;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">Bước 3: Chọn điểm tham quan theo ngày</h2>

        <div className="bg-neutral-100 p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-2 md:mb-0">
              <h3 className="font-medium">
                Hành trình: {originQuery.data?.name || "Chưa xác định"} - {destinationQuery.data?.name || "Chưa xác định"}
              </h3>
              <p className="text-sm text-neutral-600">
                {days.length > 0 ? (
                  <>
                    {formatDate(days[0].date)} - {formatDate(days[days.length - 1].date)}
                    <Badge variant="outline" className="ml-2 bg-neutral-200 text-neutral-700 hover:bg-neutral-200">
                      {days.length} ngày
                    </Badge>
                  </>
                ) : "Đang tải..."}
              </p>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-neutral-600 mr-2">Đã chọn:</p>
              <Badge className="bg-blue-100 text-blue-800">{selectedAttractions.length} điểm tham quan</Badge>
            </div>
          </div>
        </div>

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
                  <span className="text-sm font-medium">{format(day.date, "dd/MM", { locale: vi })}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {days.map((day, dayIndex) => (
            <TabsContent key={dayIndex + 1} value={(dayIndex + 1).toString()}>
              <div className="mb-4">
                <h3 className="font-medium text-lg">
                  {format(day.date, "EEEE, dd/MM/yyyy", { locale: vi })} - {locationQueries.data?.find(l => l.id === day.locationId)?.name || "Đang tải..."}
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
                  {attractionsQuery.data && attractionsQuery.data[day.locationId]?.map((attraction: Attraction) => {
                    const isSelected = isAttractionSelected(attraction.id, dayIndex + 1);
                    const selectedAttraction = selectedAttractions.find(
                      (item) => item.attractionId === attraction.id && item.day === dayIndex + 1
                    );

                    const handleIncreaseAdults = () => {
                      setSelectedAttractions((prev) =>
                        prev.map((item) =>
                          item.attractionId === attraction.id && item.day === dayIndex + 1
                            ? { ...item, adults: item.adults + 1 }
                            : item
                        )
                      );
                    };

                    const handleDecreaseAdults = () => {
                      setSelectedAttractions((prev) =>
                        prev.map((item) =>
                          item.attractionId === attraction.id && item.day === dayIndex + 1
                            ? { ...item, adults: Math.max(1, item.adults - 1) }
                            : item
                        )
                      );
                    };

                    const handleIncreaseChildren = () => {
                      setSelectedAttractions((prev) =>
                        prev.map((item) =>
                          item.attractionId === attraction.id && item.day === dayIndex + 1
                            ? {
                                ...item,
                                children: item.children + 1,
                                childrenHeights: [...item.childrenHeights, "<1m"],
                              }
                            : item
                        )
                      );
                    };

                    const handleDecreaseChildren = () => {
                      setSelectedAttractions((prev) =>
                        prev.map((item) =>
                          item.attractionId === attraction.id && item.day === dayIndex + 1
                            ? {
                                ...item,
                                children: Math.max(0, item.children - 1),
                                childrenHeights: item.childrenHeights.slice(0, -1),
                              }
                            : item
                        )
                      );
                    };

                    const handleHeightChange = (index: number, height: string) => {
                      setSelectedAttractions((prev) =>
                        prev.map((item) =>
                          item.attractionId === attraction.id && item.day === dayIndex + 1
                            ? {
                                ...item,
                                childrenHeights: item.childrenHeights.map((h, i) =>
                                  i === index ? height : h
                                ),
                              }
                            : item
                        )
                      );
                    };

                    return (
                      <div 
                        key={attraction.id}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-all shadow-hover ${
                          isSelected ? 'border-primary bg-blue-50' : 'border-neutral-300 bg-white'
                        }`}
                        onClick={() => !isSelected && selectAttraction(attraction.id, dayIndex + 1)}
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

                          {isSelected && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Người lớn:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDecreaseAdults();
                                  }}
                                >
                                  -
                                </Button>
                                <span className="text-sm">{selectedAttraction?.adults}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIncreaseAdults();
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium">Trẻ em:</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDecreaseChildren();
                                  }}
                                >
                                  -
                                </Button>
                                <span className="text-sm">{selectedAttraction?.children}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIncreaseChildren();
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                              {selectedAttraction?.children > 0 && (
                                <div className="mt-2">
                                  <span className="text-sm font-medium">Chiều cao trẻ em:</span>
                                  {Array.from({ length: selectedAttraction.children }).map((_, index) => (
                                    <div key={index} className="flex items-center gap-2 mt-1">
                                      <span className="text-sm">Trẻ em {index + 1}:</span>
                                      <select
                                        value={selectedAttraction.childrenHeights[index] || "<1m"}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleHeightChange(index, e.target.value);
                                        }}
                                        className="border rounded p-1 text-sm"
                                      >
                                        <option value="<1m">{"<1m"}</option>
                                        <option value="1-1m3">1-1m3</option>
                                        <option value=">1m3">{">1m3"}</option>
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2">
                            {isSelected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deselectAttraction(attraction.id, dayIndex + 1);
                                }}
                              >
                                Bỏ chọn
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary hover:bg-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectAttraction(attraction.id, dayIndex + 1);
                                }}
                              >
                                Thêm vào lịch trình
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-8 p-4 border-t border-neutral-300">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Chi tiết chi phí</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-base text-gray-600">Di chuyển + Lưu trú:</span>
                <span className="text-base font-medium text-gray-800">
                  {(tripData.basePrice || 0).toLocaleString()}₫
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-base text-gray-600">Điểm tham quan ({selectedAttractions.length}):</span>
                <span className="text-base font-medium text-gray-800">
                  {attractionsPrice.toLocaleString()}₫
                </span>
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-lg">Tổng tiền tạm tính:</span>
                  <span className="text-xl text-primary">{totalPrice.toLocaleString()}₫</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Đã bao gồm thuế và phí</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between p-6 pt-0">
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