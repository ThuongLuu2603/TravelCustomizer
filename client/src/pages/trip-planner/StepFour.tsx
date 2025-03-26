import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";

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

const bookingFormSchema = z.object({
  fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
  address: z.string().optional(),
  specialRequests: z.string().optional(),
  buyInsurance: z.boolean().default(false),
  buySim: z.boolean().default(false),
  needGuide: z.boolean().default(false),
  insuranceQuantity: z.number().default(0),
  simQuantity: z.number().default(0),
  guideQuantity: z.number().default(0),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function StepFour() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const basePrice = Number(tripData.basePrice) || 0;
  const attractionsTotalPrice = Number(tripData.attractionsTotalPrice) || 0;
  const adults = tripData.adults || 1;
  const children = tripData.children || 0;
  const totalPeople = adults + children;

  const [additionalServices, setAdditionalServices] = useState<{
    insurance: number;
    sim: number;
    guide: number;
  }>({
    insurance: 0,
    sim: 0,
    guide: 0,
  });

  const [insuranceQuantity, setInsuranceQuantity] = useState<number>(totalPeople);
  const [simQuantity, setSimQuantity] = useState<number>(adults);
  const [guideQuantity, setGuideQuantity] = useState<number>(1);
  const [finalTotal, setFinalTotal] = useState<number>(0);

  const { data: originLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.origin_id}`],
    enabled: !!tripData.origin_id,
  });
  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
  });

  const { data: transportationSummary } = useQuery({
    queryKey: [
      `/api/transportation-options?originId=${tripData.origin_id}&destinationId=${tripData.destination_id}`,
    ],
    enabled: !!(
      tripData.origin_id &&
      tripData.destination_id &&
      tripData.selectedDepartureOption &&
      tripData.selectedReturnOption
    ),
    select: (data) => {
      const originalDepId = Math.floor(tripData.selectedDepartureOption / 100);
      const originalRetId = Math.floor(tripData.selectedReturnOption / 100);
      const depOption = data.find((option: any) => option.id === originalDepId);
      const retOption = data.find((option: any) => option.id === originalRetId);
      return { depOption, retOption };
    },
  });

  const { data: accommodationsSummary } = useQuery({
    queryKey: ["accommodationsSummary", tripData.accommodations?.map((a) => a.location)],
    queryFn: async () => {
      const results = await Promise.all(
        (tripData.accommodations || []).map((accom) =>
          fetch(`/api/accommodations?locationId=${accom.location}`).then((res) => res.json())
        )
      );
      const selectedAccomIds = tripData.selectedAccommodations
        ? Object.values(tripData.selectedAccommodations)
        : [];
      return results
        .flat()
        .filter((accom: any) => selectedAccomIds.includes(accom.id))
        .map((accom: any) => {
          const tripAccom = tripData.accommodations.find(
            (a) => tripData.selectedAccommodations[a.id] === accom.id
          );
          return { ...accom, checkIn: tripAccom?.checkIn, checkOut: tripAccom?.checkOut };
        });
    },
    enabled: !!tripData.accommodations && tripData.accommodations.length > 0,
  });

  // Query để lấy tất cả các điểm tham quan
  const { data: attractions, isLoading: isLoadingAttractions, error: attractionsError } = useQuery<
    Attraction[]
  >({
    queryKey: ["all-attractions"],
    queryFn: async () => {
      // API không hỗ trợ lấy tất cả các điểm tham quan, nên chúng ta sẽ lấy theo từng địa điểm cụ thể
      // Vì bây giờ chỉ có 2 địa điểm chính (origin và destination), chúng ta sẽ lấy cả hai
      const locationIds = [tripData.origin_id, tripData.destination_id].filter(Boolean);

      if (!locationIds.length) {
        console.log("Không có địa điểm nào để truy vấn điểm tham quan");
        return [];
      }

      try {
        // Thu thập tất cả các kết quả từ các yêu cầu API
        const allResults = [];

        for (const locationId of locationIds) {
          const response = await fetch(`/api/attractions?locationId=${locationId}`);
          if (!response.ok) {
            console.warn(`Không thể lấy điểm tham quan cho địa điểm ${locationId}`);
            continue;
          }

          const result = await response.json();
          if (Array.isArray(result)) {
            allResults.push(...result);
          }
        }

        console.log("Tất cả các điểm tham quan:", allResults);
        return allResults;
      } catch (error) {
        console.error("Lỗi khi tải điểm tham quan:", error);
        return [];
      }
    },
    enabled: !!(tripData.origin_id || tripData.destination_id),
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      specialRequests: "",
      buyInsurance: false,
      buySim: false,
      needGuide: false,
      insuranceQuantity: totalPeople,
      simQuantity: adults,
      guideQuantity: 1,
    },
  });

  useEffect(() => {
    const servicesTotal =
      additionalServices.insurance + additionalServices.sim + additionalServices.guide;
    const newFinalTotal = basePrice + attractionsTotalPrice + servicesTotal;
    console.log("Final Total:", newFinalTotal, { basePrice, attractionsTotalPrice, servicesTotal });
    setFinalTotal(newFinalTotal);
  }, [basePrice, attractionsTotalPrice, additionalServices]);

  // Log dữ liệu để kiểm tra
  useEffect(() => {
    console.log("tripData:", tripData);
    console.log("tripData.selectedAttractions:", tripData.selectedAttractions);
    console.log("attractions (final):", attractions);
    console.log("attractionsError:", attractionsError);
  }, [tripData, tripData.selectedAttractions, attractions, attractionsError]);

  const formatDate = (date: Date | string) => format(new Date(date), "dd/MM/yyyy", { locale: vi });

  const getTripDuration = () => {
    if (tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  const getTripDays = () => {
    if (tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      const dayCount = differenceInDays(end, start) + 1;
      const daysArray: Date[] = [];
      for (let i = 0; i < dayCount; i++) {
        daysArray.push(addDays(start, i));
      }
      return daysArray;
    }
    return [];
  };

  const updateServicePrice = () => {
    const tripDuration = getTripDuration();
    const insurancePrice = form.getValues("buyInsurance") ? insuranceQuantity * 120000 : 0;
    const simPrice = form.getValues("buySim") ? simQuantity * 100000 : 0;
    const guidePrice = form.getValues("needGuide") ? guideQuantity * 1500000 * tripDuration : 0;

    setAdditionalServices({
      insurance: insurancePrice,
      sim: simPrice,
      guide: guidePrice,
    });
  };

  const handleQuantityChange = (service: string, delta: number) => {
    if (service === "insurance") {
      const newQuantity = Math.max(0, insuranceQuantity + delta);
      setInsuranceQuantity(newQuantity);
      form.setValue("insuranceQuantity", newQuantity);
    } else if (service === "sim") {
      const newQuantity = Math.max(0, simQuantity + delta);
      setSimQuantity(newQuantity);
      form.setValue("simQuantity", newQuantity);
    } else if (service === "guide") {
      const newQuantity = Math.max(0, guideQuantity + delta);
      setGuideQuantity(newQuantity);
      form.setValue("guideQuantity", newQuantity);
    }
    updateServicePrice();
  };

  const onServiceToggle = (service: string, checked: boolean) => {
    if (service === "insurance") form.setValue("buyInsurance", checked);
    else if (service === "sim") form.setValue("buySim", checked);
    else if (service === "guide") form.setValue("needGuide", checked);
    updateServicePrice();
  };

  const onSubmit = (data: BookingFormValues) => {
    updateTripData({
      totalPrice: finalTotal,
      bookingInfo: data,
      additionalServices: {
        insurance: additionalServices.insurance,
        sim: additionalServices.sim,
        guide: additionalServices.guide,
      },
    });
    setCurrentStep(5);
  };

  const handleBack = () => setCurrentStep(3);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-8">
        <h2 className="font-bold text-2xl mb-6 border-b pb-3 border-gray-200">
          Bước 4: Xác nhận thông tin & Dịch vụ bổ sung
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Thông tin người đặt</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ và tên <span style={{ color: 'red' }}>*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nhập họ và tên" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại <span style={{ color: 'red' }}>*</span> </FormLabel>
                            <FormControl>
                              <Input placeholder="Nhập số điện thoại" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email <span style={{ color: 'red' }}>*</span> </FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Địa chỉ</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập địa chỉ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yêu cầu đặc biệt</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập yêu cầu (nếu có)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <h3 className="font-semibold text-lg pt-3">Dịch vụ bổ sung</h3>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="buyInsurance"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-4 p-4 border rounded-lg">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  onServiceToggle("insurance", e.target.checked);
                                }}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <p className="font-medium">Bảo hiểm du lịch</p>
                              <p className="text-sm text-gray-600">120.000₫/người</p>
                            </div>
                            {field.value && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("insurance", -1)}
                                >
                                  -
                                </Button>
                                <span className="text-sm">{insuranceQuantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("insurance", 1)}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="buySim"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-4 p-4 border rounded-lg">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  onServiceToggle("sim", e.target.checked);
                                }}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <p className="font-medium">Sim 4G data (không giới hạn)</p>
                              <p className="text-sm text-gray-600">100.000₫/sim</p>
                            </div>
                            {field.value && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("sim", -1)}
                                >
                                  -
                                </Button>
                                <span className="text-sm">{simQuantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("sim", 1)}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="needGuide"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-4 p-4 border rounded-lg">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.checked);
                                  onServiceToggle("guide", e.target.checked);
                                }}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <p className="font-medium">Hướng dẫn viên</p>
                              <p className="text-sm text-gray-600">1.500.000₫/ngày/hướng dẫn viên</p>
                            </div>
                            {field.value && (
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("guide", -1)}
                                >
                                  -
                                </Button>
                                <span className="text-sm">{guideQuantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange("guide", 1)}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                    <button type="submit" className="hidden">Submit</button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4">
                <CardTitle className="text-xl font-bold">Chi tiết đặt chỗ</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700">Thông tin chuyến đi</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-sm text-gray-600">Hành trình:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {originLocation?.name || "Chưa tải"} - {destinationLocation?.name || "Chưa tải"}
                    </span>
                    <span className="text-sm text-gray-600">Ngày đi:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {tripData.start_date ? formatDate(tripData.start_date) : "Chưa xác định"}
                    </span>
                    <span className="text-sm text-gray-600">Ngày về:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {tripData.end_date ? formatDate(tripData.end_date) : "Chưa xác định"}
                    </span>
                    <span className="text-sm text-gray-600">Số ngày:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {getTripDuration()} ngày
                    </span>
                    <span className="text-sm text-gray-600">Hành khách:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {tripData.adults} NL, {tripData.children} TE
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Chi phí</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-base text-gray-600">Di chuyển + Lưu trú:</span>
                      <span className="text-base font-medium text-gray-800">
                        {basePrice.toLocaleString()}₫
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base text-gray-600">Điểm tham quan:</span>
                      {tripData.attractionsTotalPrice !== undefined ? (
                        <span className="text-base font-medium text-gray-800">
                          {attractionsTotalPrice.toLocaleString()}₫
                        </span>
                      ) : (
                        <span className="text-base font-medium text-gray-500">Chưa chọn</span>
                      )}
                    </div>
                    {additionalServices.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Bảo hiểm:</span>
                        <span className="text-base font-medium text-gray-800">
                          {additionalServices.insurance.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    {additionalServices.sim > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Sim 4G:</span>
                        <span className="text-base font-medium text-gray-800">
                          {additionalServices.sim.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    {additionalServices.guide > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Hướng dẫn viên:</span>
                        <span className="text-base font-medium text-gray-800">
                          {additionalServices.guide.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold mt-3">
                      <span className="text-lg">Tổng tiền:</span>
                      <span className="text-xl text-primary">{finalTotal.toLocaleString()}₫</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Đã bao gồm thuế và phí</p>
                </div>



                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Thông tin di chuyển & lưu trú
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Chiều đi:</p>
                      {transportationSummary && transportationSummary.depOption ? (
                        <div className="text-sm text-gray-600">
                          {transportationSummary.depOption.provider} -{" "}
                          {transportationSummary.depOption.departure_flight_number} (
                          {transportationSummary.depOption.departure_time} -{" "}
                          {transportationSummary.depOption.departure_arrival_time || "Chưa xác định"})
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có thông tin chiều đi.</p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Hành lý:</span>{" "}
                        {transportationSummary && transportationSummary.depOption
                          ? transportationSummary.depOption.departure_baggage || "Chưa xác định"
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Chiều về:</p>
                      {transportationSummary && transportationSummary.retOption ? (
                        <div className="text-sm text-gray-600">
                          {transportationSummary.retOption.provider} -{" "}
                          {transportationSummary.retOption.return_flight_number} (
                          {transportationSummary.retOption.return_time} -{" "}
                          {transportationSummary.retOption.return_arrival_time || "Chưa xác định"})
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có thông tin chiều về.</p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Hành lý:</span>{" "}
                        {transportationSummary && transportationSummary.retOption
                          ? transportationSummary.retOption.return_baggage || "Chưa xác định"
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Lưu trú:</p>
                      {accommodationsSummary && accommodationsSummary.length > 0 ? (
                        accommodationsSummary.map((accom: any) => (
                          <div key={accom.id} className="mb-2 text-sm text-gray-600">
                            <div>
                              {accom.name} - {accom.address}
                            </div>
                            <div>
                              Nhận phòng:{" "}
                              {accom.checkIn
                                ? formatDate(accom.checkIn)
                                : tripData.start_date
                                ? formatDate(tripData.start_date)
                                : "Chưa xác định"}{" "}
                              | Trả phòng:{" "}
                              {accom.checkOut
                                ? formatDate(accom.checkOut)
                                : tripData.end_date
                                ? formatDate(tripData.end_date)
                                : "Chưa xác định"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có thông tin lưu trú.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 mb-6">
        <div className="container mx-auto px-6 py-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Chi tiết lịch trình chuyến đi</h3>
          {isLoadingAttractions ? (
            <p className="text-sm text-gray-600">Đang tải chi tiết hành trình...</p>
          ) : attractionsError ? (
            <p className="text-sm text-red-600">
              Lỗi khi tải thông tin điểm tham quan: {attractionsError.message}
            </p>
          ) : (
            <Accordion type="single" collapsible defaultValue="day-0" className="w-full">
              {getTripDays().map((day, index) => {
                const isFirstDay = index === 0;
                const isLastDay = index === getTripDays().length - 1;
                const dayAttractions = (tripData.selectedAttractions || []).filter(
                  (attr: any) => attr.day === index + 1
                );

                // Tìm khách sạn cho ngày hiện tại
                const dayAccommodation = accommodationsSummary?.find((accom: any) => {
                  const checkInDate = accom.checkIn ? new Date(accom.checkIn) : new Date(tripData.start_date || "");
                  const checkOutDate = accom.checkOut ? new Date(accom.checkOut) : new Date(tripData.end_date || "");
                  return day >= checkInDate && day < checkOutDate;
                });

                // Chuẩn bị tiêu đề cho ngày với điểm đến
                let dayTitle = `Ngày ${index + 1}: ${formatDate(day)}`;
                if (isFirstDay) {
                  dayTitle += ` | ${originLocation?.name || ""} - ${destinationLocation?.name || ""}`;
                } else if (isLastDay) {
                  dayTitle += ` | ${destinationLocation?.name || ""} - ${originLocation?.name || ""}`;
                } else {
                  dayTitle += ` | ${destinationLocation?.name || ""}`;
                }

                // Xác định chi tiết mô tả theo template
                const getDayDescription = () => {
                  if (isFirstDay && transportationSummary?.depOption) {
                    const depTime = transportationSummary.depOption.departure_time;
                    const arrivalTime = transportationSummary.depOption.departure_arrival_time || "";

                    // Tính giờ đến dưới dạng số để so sánh (ví dụ: "10:30" -> 10.5)
                    let arrivalHour = 12; // Mặc định là trưa nếu không thể phân tích
                    if (arrivalTime) {
                      const [hours, minutes] = arrivalTime.split(':').map(Number);
                      if (!isNaN(hours)) {
                        arrivalHour = hours + (minutes || 0) / 60;
                      }
                    }

                    // Lấy danh sách điểm tham quan của ngày đầu tiên, sắp xếp theo thời gian
                    const shortAttraction = attractions && attractions
                      .filter(a => a.duration && (a.duration.includes('1h') || a.duration.includes('2h')))
                      .find(a => dayAttractions.some(da => da.attractionId === a.id));

                    const firstAttraction = dayAttractions.length > 0 && attractions ? 
                      attractions.find(a => a.id === dayAttractions[0]?.attractionId) : null;

                    const secondAttraction = dayAttractions.length > 1 && attractions ? 
                      attractions.find(a => a.id === dayAttractions[1]?.attractionId) : null;

                    // Tạo template dựa vào thời gian đến
                    let template = `
                      <div class="space-y-4">
                        <div class="border-l-2 border-amber-200 pl-3 pb-3">
                          <p class="font-medium text-gray-800">Sáng:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách đến sân bay ${originLocation?.name || ""} đón chuyến bay đi ${destinationLocation?.name || ""}, thông tin chuyến bay:
                          </p>
                          <p class="text-sm text-gray-600">
                            ${transportationSummary.depOption.provider} - ${transportationSummary.depOption.departure_flight_number}<br/>
                            Giờ khởi hành: ${transportationSummary.depOption.departure_time}<br/> 
                            Giờ đến: ${transportationSummary.depOption.departure_arrival_time || "Chưa xác định"}<br/>
                            Hành lý: ${transportationSummary.depOption.departure_baggage || "Tiêu chuẩn"}
                          </p>
                          <p class="text-sm text-gray-600">
                            Đến nơi, Quý khách di chuyển về trung tâm ${destinationLocation?.name || ""}.
                          </p>
                        </div>`;

                    if (arrivalHour < 10) {
                      // Trước 10h sáng
                      template += `
                        <div class="border-l-2 border-blue-200 pl-3 pb-3">
                          <p class="font-medium text-gray-800">Sáng - Trưa:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách tham quan:
                          </p>
                          ${shortAttraction ? `
                          <div class="ml-4 my-2">
                            <p class="font-medium text-gray-700">${shortAttraction.name}</p>
                            <p class="text-sm text-gray-600">${shortAttraction.description}</p>
                          </div>
                          ` : `
                          <p class="text-sm text-gray-600 ml-4">
                            Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.
                          </p>
                          `}

                          <p class="font-medium text-gray-800 mt-3">Trưa:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách dừng trưa ở các nhà hàng đặc sản địa phương.
                          </p>

                          <p class="font-medium text-gray-800 mt-3">Chiều:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách về nhận phòng khách sạn và tiếp tục tham quan:
                          </p>
                          ${firstAttraction && shortAttraction && firstAttraction.id !== shortAttraction.id ? `
                          <div class="ml-4 my-2">
                            <p class="font-medium text-gray-700">${firstAttraction.name}</p>
                            <p class="text-sm text-gray-600">${firstAttraction.description}</p>
                          </div>
                          ` : secondAttraction ? `
                          <div class="ml-4 my-2">
                            <p class="font-medium text-gray-700">${secondAttraction.name}</p>
                            <p class="text-sm text-gray-600">${secondAttraction.description}</p>
                          </div>
                          ` : `
                          <p class="text-sm text-gray-600 ml-4">
                            Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.
                          </p>
                          `}
                        </div>`;
                    } else if (arrivalHour < 12) {
                      // Trước 12h trưa
                      template += `
                        <div class="border-l-2 border-blue-200 pl-3 pb-3">
                          <p class="font-medium text-gray-800">Trưa:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách ăn trưa tại nhà hàng địa phương, rồi bắt đầu tham quan:
                          </p>
                          ${dayAttractions.length > 0 && attractions ? dayAttractions.map((attr, i) => {
                            const attrDetail = attractions.find(a => a.id === attr.attractionId);
                            return attrDetail ? `
                            <div class="ml-4 my-2">
                              <p class="font-medium text-gray-700">${attrDetail.name}</p>
                              <p class="text-sm text-gray-600">${attrDetail.description}</p>
                            </div>
                            ` : '';
                          }).join('') : `
                          <p class="text-sm text-gray-600 ml-4">
                            Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.
                          </p>
                          `}
                        </div>`;
                    } else if (arrivalHour < 16) {
                      // Trước 16h chiều
                      template += `
                        <div class="border-l-2 border-blue-200 pl-3 pb-3">
                          <p class="font-medium text-gray-800">Chiều:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách về nhận phòng khách sạn và tham quan:
                          </p>
                          ${dayAttractions.length > 0 && attractions ? dayAttractions.map((attr, i) => {
                            const attrDetail = attractions.find(a => a.id === attr.attractionId);
                            return attrDetail ? `
                            <div class="ml-4 my-2">
                              <p class="font-medium text-gray-700">${attrDetail.name}</p>
                              <p class="text-sm text-gray-600">${attrDetail.description}</p>
                            </div>
                            ` : '';
                          }).join('') : `
                          <p class="text-sm text-gray-600 ml-4">
                            Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.
                          </p>
                          `}
                        </div>`;
                    } else {
                      // Sau 16h
                      template += `
                        <div class="border-l-2 border-blue-200 pl-3 pb-3">
                          <p class="font-medium text-gray-800">Tối:</p>
                          <p class="text-sm text-gray-600">
                            Quý khách về nhận phòng khách sạn nghỉ ngơi và tự do khám phá ${destinationLocation?.name || ""}.
                          </p>
                        </div>`;
                    }

                    // Thông tin tối và lưu trú chung cho tất cả các template, tùy chỉnh theo địa điểm
                    const getLocalSpecialties = () => {
                      if (destinationLocation?.id === 4) { // Phú Quốc
                        return "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Ghẹ Hàm Ninh, nhum biển nướng, gỏi cá trích, bào ngư nướng, còi biên mai, cá sòng, hải sản khác tại chợ đêm...";
                      } else if (destinationLocation?.id === 5) { // Đà Lạt
                        return "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Lẩu bò, lẩu gà lá é, pizza rau củ Đà Lạt, bánh tráng nướng, bánh căn, artichoke, strawberry, nước ép cà rốt đỏ, rượu vang...";
                      } else if (destinationLocation?.id === 6) { // Nha Trang
                        return "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Bánh căn, bánh xèo mực, hải sản tươi sống, nem nướng Ninh Hòa, bún chả cá, bún sứa, ốc hút...";
                      } else if (destinationLocation?.id === 7) { // Hạ Long
                        return "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Chả mực, sá sùng, bề bề rang me, ngán hấp, tu hài, sam biển, sashimi cá ngừ đại dương...";
                      } else {
                        return `Quý khách ăn tối tự do tại địa phương thưởng thức các món đặc sản địa phương.`;
                      }
                    };

                    template += `
                      <div class="border-l-2 border-green-200 pl-3 pb-3">
                        <p class="font-medium text-gray-800">Tối:</p>
                        <p class="text-sm text-gray-600">
                          ${getLocalSpecialties()}
                        </p>
                        <p class="text-sm text-gray-600">
                          Tự do khám phá thành phố ${destinationLocation?.name || ""} về đêm.
                        </p>
                        <p class="font-medium text-gray-800 mt-2">Nghỉ đêm tại khách sạn:</p>
                        <p class="text-sm text-gray-600">
                          ${dayAccommodation ? dayAccommodation.name : 'Chưa chọn khách sạn'} ${dayAccommodation ? `- ${dayAccommodation.address}` : ''}
                        </p>
                      </div>
                    </div>`;

                    return template;
                  } else if (isLastDay && transportationSummary?.retOption) {
                    // Template cho ngày cuối
                    const dayAttractionsHtml = dayAttractions.length > 0 && attractions
                      ? dayAttractions.map((attr, i) => {
                          const attrDetail = attractions.find(a => a.id === attr.attractionId);
                          return attrDetail ? `
                          <div class="ml-4 my-2">
                            <p class="font-medium text-gray-700">${attrDetail.name}</p>
                            <p class="text-sm text-gray-600">${attrDetail.description}</p>
                          </div>
                          ` : '';
                        }).join('') 
                      : `<p class="text-sm text-gray-600 ml-4">Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.</p>`;

                    return `
                    <div class="space-y-4">
                      <div class="border-l-2 border-blue-200 pl-3 pb-3">
                        <p class="font-medium text-gray-800">Sáng:</p>
                        <p class="text-sm text-gray-600">
                          Quý khách ăn sáng tại khách sạn, làm thủ tục trả phòng.
                        </p>
                        <p class="font-medium text-gray-800 mt-2">Tham quan:</p>
                        ${dayAttractionsHtml}
                      </div>

                      <div class="border-l-2 border-amber-200 pl-3 pb-3">
                        <p class="font-medium text-gray-800">Chiều:</p>
                        <p class="text-sm text-gray-600">
                          Quý khách di chuyển ra sân bay, đón chuyến bay về ${originLocation?.name || ""}:
                        </p>
                        <p class="text-sm text-gray-600">
                          ${transportationSummary.retOption.provider} - ${transportationSummary.retOption.return_flight_number}<br/>
                          Giờ khởi hành: ${transportationSummary.retOption.return_time}<br/> 
                          Giờ đến: ${transportationSummary.retOption.return_arrival_time || "Chưa xác định"}<br/>
                          Hành lý: ${transportationSummary.retOption.return_baggage || "Tiêu chuẩn"}
                        </p>
                        <p class="text-sm text-gray-600">
                          Kết thúc chuyến đi. Hẹn gặp lại quý khách trong những hành trình tiếp theo.
                        </p>
                      </div>
                    </div>`;
                  } else {
                    // Template cho các ngày ở giữa
                    const dayAttractionsHtml = dayAttractions.length > 0 && attractions
                      ? dayAttractions.map((attr, i) => {
                          const attrDetail = attractions.find(a => a.id === attr.attractionId);
                          return attrDetail ? `
                          <div class="ml-4 my-2">
                            <p class="font-medium text-gray-700">${attrDetail.name}</p>
                            <p class="text-sm text-gray-600">${attrDetail.description}</p>
                          </div>
                          ` : '';
                        }).join('') 
                      : `<p class="text-sm text-gray-600 ml-4">Quý khách tự do khám phá các hoạt động vui chơi tại ${destinationLocation?.name || ""}.</p>`;

                    // Lấy đặc sản dựa trên địa điểm
                    let specialtyText = "";
                    if (destinationLocation?.id === 4) { // Phú Quốc
                      specialtyText = "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Ghẹ Hàm Ninh, nhum biển nướng, gỏi cá trích, bào ngư nướng, còi biên mai, cá sòng, hải sản khác tại chợ đêm...";
                    } else if (destinationLocation?.id === 5) { // Đà Lạt
                      specialtyText = "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Lẩu bò, lẩu gà lá é, pizza rau củ Đà Lạt, bánh tráng nướng, bánh căn, artichoke, strawberry, nước ép cà rốt đỏ, rượu vang...";
                    } else if (destinationLocation?.id === 6) { // Nha Trang
                      specialtyText = "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Bánh căn, bánh xèo mực, hải sản tươi sống, nem nướng Ninh Hòa, bún chả cá, bún sứa, ốc hút...";
                    } else if (destinationLocation?.id === 7) { // Hạ Long
                      specialtyText = "Quý khách ăn tối tự do tại địa phương với các đặc sản như: Chả mực, sá sùng, bề bề rang me, ngán hấp, tu hài, sam biển, sashimi cá ngừ đại dương...";
                    } else {
                      specialtyText = `Quý khách ăn tối tự do tại địa phương thưởng thức các món đặc sản địa phương.`;
                    }

                    return `
                    <div class="space-y-4">
                      <div class="border-l-2 border-blue-200 pl-3 pb-3">
                        <p class="font-medium text-gray-800">Sáng:</p>
                        <p class="text-sm text-gray-600">
                          Quý khách ăn sáng tại khách sạn. Sau đó tham quan:
                        </p>
                        ${dayAttractionsHtml}
                      </div>

                      <div class="border-l-2 border-green-200 pl-3 pb-3">
                        <p class="font-medium text-gray-800">Trưa:</p>
                        <p class="text-sm text-gray-600">
                          Quý khách dùng bữa trưa tại nhà hàng địa phương.
                        </p>

                        <p class="font-medium text-gray-800 mt-3">Chiều:</p>
                        <p class="text-sm text-gray-600">
                          Quý khách tiếp tục tham quan hoặc tự do nghỉ ngơi.
                        </p>

                        <p class="font-medium text-gray-800 mt-3">Tối:</p>
                        <p class="text-sm text-gray-600">
                          ${specialtyText}
                        </p>
                        <p class="text-sm text-gray-600">
                          Tự do khám phá thành phố ${destinationLocation?.name || ""} về đêm.
                        </p>

                        <p class="font-medium text-gray-800 mt-2">Nghỉ đêm tại khách sạn:</p>
                        <p class="text-sm text-gray-600">
                          ${dayAccommodation ? dayAccommodation.name : 'Chưa chọn khách sạn'} ${dayAccommodation ? `- ${dayAccommodation.address}` : ''}
                        </p>
                      </div>
                    </div>`;
                  }
                };

                return (
                  <AccordionItem key={index} value={`day-${index}`}>
                    <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                      {dayTitle}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm max-w-none" 
                        dangerouslySetInnerHTML={{ __html: getDayDescription() }} 
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>

      <div className="flex justify-between p-6 pt-0">
        <Button variant="outline" onClick={handleBack} className="px-4 py-2">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Quay lại
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-2"
        >
          Tiếp tục đến thanh toán
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
    </div>
  );
}