import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const bookingFormSchema = z.object({
  fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
  address: z.string().optional(),
  specialRequests: z.string().optional(),
  buyInsurance: z.boolean().default(false),
  buySim: z.boolean().default(false),
  needGuide: z.boolean().default(false),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function StepFour() {
  const { tripData, updateTripData, setCurrentStep } = useTripContext();
  const basePrice = Number(tripData.totalPrice) || 0;
  const [additionalServices, setAdditionalServices] = useState<{ insurance: number; sim: number; guide: number; }>({
    insurance: 0,
    sim: 0,
    guide: 0,
  });
  const [finalTotal, setFinalTotal] = useState<number>(0);

  // Get location info
  const { data: originLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.origin_id}`],
    enabled: !!tripData.origin_id,
  });
  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
  });

  // Query transportation summary (chuyển đổi ID gốc từ selectedOption)
  const { data: transportationSummary } = useQuery({
    queryKey: [
      `/api/transportation-options?originId=${tripData.origin_id}&destinationId=${tripData.destination_id}`
    ],
    enabled: !!(tripData.origin_id && tripData.destination_id && tripData.selectedDepartureOption && tripData.selectedReturnOption),
    select: (data) => {
      const originalDepId = Math.floor(tripData.selectedDepartureOption / 100);
      const originalRetId = Math.floor(tripData.selectedReturnOption / 100);
      const depOption = data.find((option: any) => option.id === originalDepId);
      const retOption = data.find((option: any) => option.id === originalRetId);
      return { depOption, retOption };
    },
  });

  // Query accommodations summary
  const { data: accommodationsSummary } = useQuery({
    queryKey: [`/api/accommodations?locationId=${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
    select: (data) => {
      const selectedAccomIds = tripData.selectedAccommodations ? Object.values(tripData.selectedAccommodations) : [];
      return data.filter((accom: any) => selectedAccomIds.includes(accom.id));
    },
  });

  // Query attractions
  const { data: attractions } = useQuery({
    queryKey: [`/api/attractions?locationId=${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
    select: (data) =>
      data.filter((attr: any) =>
        tripData.selectedAttractions?.some((item: any) => item.attractionId === attr.id)
      ),
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
    },
  });

  useEffect(() => {
    const attractionTotal = attractions?.reduce((sum: number, attr: any) => sum + Number(attr.price), 0) || 0;
    const servicesTotal = additionalServices.insurance + additionalServices.sim + additionalServices.guide;
    setFinalTotal(basePrice + attractionTotal + servicesTotal);
  }, [basePrice, attractions, additionalServices]);

  const formatDate = (date: Date | string) => format(new Date(date), "dd/MM/yyyy", { locale: vi });
  const getTripDuration = () => {
    if (tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  const onServiceChange = (service: string, checked: boolean) => {
    const tripDuration = getTripDuration();
    const adults = tripData.adults || 1;
    const children = tripData.children || 0;
    const totalPeople = adults + children;
    if (service === "insurance") {
      setAdditionalServices(prev => ({ ...prev, insurance: checked ? 120000 * totalPeople : 0 }));
    } else if (service === "sim") {
      setAdditionalServices(prev => ({ ...prev, sim: checked ? 100000 * adults : 0 }));
    } else if (service === "guide") {
      setAdditionalServices(prev => ({ ...prev, guide: checked ? 1500000 * tripDuration : 0 }));
    }
  };

  const onSubmit = (data: BookingFormValues) => {
    updateTripData({
      totalPrice: finalTotal,
      bookingInfo: data,
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
          {/* Booking form */}
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
                            <FormLabel>Họ và tên</FormLabel>
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
                            <FormLabel>Số điện thoại</FormLabel>
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
                          <FormLabel>Email</FormLabel>
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
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange("insurance", checked === true);
                                }}
                              />
                            </FormControl>
                            <div>
                              <p className="font-medium">Bảo hiểm du lịch</p>
                              <p className="text-sm text-gray-600">
                                120.000₫/người
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="buySim"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-4 p-4 border rounded-lg">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange("sim", checked === true);
                                }}
                              />
                            </FormControl>
                            <div>
                              <p className="font-medium">Sim 4G data (không giới hạn)</p>
                              <p className="text-sm text-gray-600">
                                100.000₫/người lớn
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="needGuide"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-4 p-4 border rounded-lg">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange("guide", checked === true);
                                }}
                              />
                            </FormControl>
                            <div>
                              <p className="font-medium">Hướng dẫn viên</p>
                              <p className="text-sm text-gray-600">
                                1.500.000₫/ngày
                              </p>
                            </div>
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

          {/* Bản tóm tắt chuyến đi */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4">
                <CardTitle className="text-xl font-bold">Tóm tắt chuyến đi</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Trip Overview */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-700">Thông tin chuyến đi</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-sm text-gray-600">Hành trình:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {originLocation?.name} - {destinationLocation?.name}
                    </span>
                    <span className="text-sm text-gray-600">Ngày đi:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {tripData.start_date && formatDate(tripData.start_date)}
                    </span>
                    <span className="text-sm text-gray-600">Ngày về:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {tripData.end_date && formatDate(tripData.end_date)}
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

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Chi phí</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-base text-gray-600">Di chuyến + Lưu trú:</span>
                      <span className="text-base font-medium text-gray-800">{basePrice.toLocaleString()}₫</span>
                    </div>
                    {attractions && attractions.length > 0 && attractions.map((attr: any) => (
                      <div key={attr.id} className="flex justify-between">
                        <span className="text-base text-gray-600">{attr.name}:</span>
                        <span className="text-base font-medium text-gray-800">{Number(attr.price).toLocaleString()}₫</span>
                      </div>
                    ))}
                    {/* Dịch vụ bổ sung */}
                    {additionalServices.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Bảo hiểm:</span>
                        <span className="text-base font-medium text-gray-800">{additionalServices.insurance.toLocaleString()}₫</span>
                      </div>
                    )}
                    {additionalServices.sim > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Sim 4G:</span>
                        <span className="text-base font-medium text-gray-800">{additionalServices.sim.toLocaleString()}₫</span>
                      </div>
                    )}
                    {additionalServices.guide > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Hướng dẫn viên:</span>
                        <span className="text-base font-medium text-gray-800">{additionalServices.guide.toLocaleString()}₫</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold mt-3">
                      <span className="text-lg">Tổng tiền:</span>
                      <span className="text-xl text-primary">
                        {(
                          basePrice +
                          (attractions?.reduce((sum: number, attr: any) => sum + Number(attr.price), 0) || 0) +
                          additionalServices.insurance +
                          additionalServices.sim +
                          additionalServices.guide
                        ).toLocaleString()}₫
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Đã bao gồm thuế và phí</p>
                </div>

                {/* Thông tin di chuyển & lưu trú */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Thông tin di chuyển & lưu trú</h3>
                  <div className="space-y-4">
                    {/* Di chuyển */}
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Chiều đi:</p>
                      {transportationSummary && transportationSummary.depOption ? (
                        <div className="text-sm text-gray-600">
                          {transportationSummary.depOption.provider} - {transportationSummary.depOption.departure_flight_number} (
                          {transportationSummary.depOption.departure_time} -{" "}
                          {transportationSummary.depOption.departure_arrival_time || "Chưa xác định"}
                          )
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
                          {transportationSummary.retOption.provider} - {transportationSummary.retOption.return_flight_number} (
                          {transportationSummary.retOption.return_time} -{" "}
                          {transportationSummary.retOption.return_arrival_time || "Chưa xác định"}
                          )
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
                    {/* Lưu trú */}
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

      {/* Bottom Navigation */}
      <div className="flex justify-between p-6 pt-0">
        <Button variant="outline" onClick={handleBack} className="px-4 py-2">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Quay lại
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} className="bg-primary hover:bg-blue-700 text-white px-6 py-2">
          Tiếp tục đến thanh toán
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
