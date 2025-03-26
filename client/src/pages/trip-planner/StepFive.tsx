import { useState, useEffect } from "react";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export default function StepFive() {
  const { tripData, resetTripData, setCurrentStep } = useTripContext();
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const basePrice = Number(tripData.totalPrice) || 0;

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
  const { data: attractions } = useQuery({
    queryKey: [`/api/attractions?locationId=${tripData.destination_id}`],
    enabled: !!tripData.destination_id,
    select: (data) =>
      data.filter((attr: any) =>
        tripData.selectedAttractions?.some((item: any) => item.attractionId === attr.id)
      ),
  });

  const { data: accommodationsSummary } = useQuery({
    queryKey: ["accommodationsSummary", tripData.accommodations?.map(a => a.location)],
    queryFn: async () => {
      const results = await Promise.all(
        (tripData.accommodations || []).map(accom => 
          fetch(`/api/accommodations?locationId=${accom.location}`).then(res => res.json())
        )
      );
      const selectedAccomIds = tripData.selectedAccommodations ? Object.values(tripData.selectedAccommodations) : [];
      return results.flat().filter((accom: any) => selectedAccomIds.includes(accom.id)).map((accom: any) => {
        const tripAccom = tripData.accommodations.find(a => tripData.selectedAccommodations[a.id] === accom.id);
        return { ...accom, checkIn: tripAccom?.checkIn, checkOut: tripAccom?.checkOut };
      });
    },
    enabled: !!tripData.accommodations && tripData.accommodations.length > 0,
  });

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    return format(new Date(date), "dd/MM/yyyy", { locale: vi });
  };

  const getTripDuration = () => {
    if (tripData.start_date && tripData.end_date) {
      const start = new Date(tripData.start_date);
      const end = new Date(tripData.end_date);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  const validatePayment = () => {
    if (paymentMethod === "credit_card") {
      const cardNumber = (document.getElementById("card_number") as HTMLInputElement)?.value;
      const cardName = (document.getElementById("card_name") as HTMLInputElement)?.value;
      const expDate = (document.getElementById("exp_date") as HTMLInputElement)?.value;
      const cvv = (document.getElementById("cvv") as HTMLInputElement)?.value;
      if (!cardNumber || !cardName || !expDate || !cvv) {
        toast({
          title: "Thiếu thông tin",
          description: "Vui lòng điền đầy đủ thông tin thẻ",
          variant: "destructive",
        });
        return false;
      }
      if (cardNumber.length < 16) {
        toast({
          title: "Số thẻ không hợp lệ",
          description: "Vui lòng kiểm tra lại số thẻ",
          variant: "destructive",
        });
        return false;
      }
      if (cvv.length < 3) {
        toast({
          title: "Mã CVV không hợp lệ",
          description: "Vui lòng kiểm tra lại mã CVV",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handlePaymentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validatePayment()) return;
    setIsSubmitting(true);

    try {
      // Gửi yêu cầu tạo chuyến đi
      const response = await apiRequest("POST", "/api/trips", {
        origin_id: tripData.origin_id,
        destination_id: tripData.destination_id,
        transportation_type_id: tripData.transportation_type_id,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        adults: tripData.adults,
        children: tripData.children,
        total_price: tripData.totalPrice,
        status: "confirmed",
      });
      const createdTrip = await response.json();

      // Xử lý accommodations
      if (tripData.selectedAccommodations && tripData.accommodations) {
        for (const key of Object.keys(tripData.selectedAccommodations)) {
          const index = Number(key);
          const accommodationId = tripData.selectedAccommodations[index];
          const accommodationData = tripData.accommodations[index];

          if (accommodationId && accommodationData) {
            // Chuyển đổi checkIn và checkOut sang định dạng chuỗi YYYY-MM-DD
            const formatDateForAPI = (date: Date | undefined) => {
              if (!date) return undefined;
              return format(new Date(date), "yyyy-MM-dd");
            };

            await apiRequest("POST", `/api/trips/${createdTrip.id}/accommodations`, {
              accommodation_id: accommodationId,
              location: accommodationData.location,
              check_in_date: formatDateForAPI(accommodationData.checkIn),
              check_out_date: formatDateForAPI(accommodationData.checkOut),
            });
          }
        }
      }

      // Xử lý transportation
      if (tripData.selectedTransportation) {
        await apiRequest("POST", `/api/trips/${createdTrip.id}/transportations`, {
          transportation_option_id: tripData.selectedTransportation,
        });
      } else {
        console.warn("Không có thông tin phương tiện di chuyển được chọn.");
      }

      // Xử lý attractions
      if (tripData.selectedAttractions && tripData.selectedAttractions.length > 0) {
        for (const attraction of tripData.selectedAttractions) {
          await apiRequest("POST", `/api/trips/${createdTrip.id}/attractions`, {
            attraction_id: attraction.attractionId,
            day: attraction.day,
            time_slot: attraction.timeSlot || "morning",
          });
        }
      } else {
        console.warn("Không có điểm tham quan nào được chọn.");
      }

      // Hiển thị thông báo thành công
      toast({
        title: "Thanh toán thành công",
        description: "Chuyến đi của bạn đã được xác nhận",
      });
      setIsSuccess(true);
    } catch (error) {
      // Ghi chi tiết lỗi vào console để debug
      console.error("Chi tiết lỗi thanh toán:", error);
      toast({
        title: "Lỗi thanh toán",
        description: "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnHome = () => {
    resetTripData();
    setLocation("/");
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-md p-10 mx-auto max-w-md text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt chỗ thành công!</h2>
          <p className="text-gray-600 mb-4">
            Cảm ơn bạn đã đặt chuyến đi đến {destinationLocation?.name}. Xác nhận đã được gửi qua email.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <p className="font-medium text-gray-800 mb-1">Thông tin chuyến đi:</p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Mã đặt chỗ:</span> TJ-
              {Math.floor(100000 + Math.random() * 900000)}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Ngày:</span>{" "}
              {format(new Date(tripData.start_date), "dd/MM/yyyy", { locale: vi })} -{" "}
              {format(new Date(tripData.end_date), "dd/MM/yyyy", { locale: vi })}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Hành khách:</span> {tripData.adults} người lớn,{" "}
              {tripData.children} trẻ em
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleReturnHome} className="bg-primary hover:bg-blue-700">
              Về trang chủ
            </Button>
            <Button variant="outline" className="border-gray-300">
              Xem chi tiết đặt chỗ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-8">
        <h2 className="font-bold text-2xl mb-6 border-b pb-3 border-gray-200">
          Bước 5: Thanh toán
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4">
                <CardTitle className="text-xl font-bold">Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <RadioGroup
                  defaultValue="credit_card"
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-3 border rounded-md p-4 hover:shadow-md">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M6 15H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M11 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Thẻ tín dụng / Ghi nợ
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-md p-4 hover:shadow-md">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-3 text-pink-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="currentColor" fillOpacity="0.1" />
                        <path d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" fill="currentColor" />
                        <path d="M16 15C15.4565 15.5981 14.7637 16.0627 13.9871 16.3482C13.2104 16.6337 12.3789 16.7323 11.5621 16.6353C10.7454 16.5382 9.96372 16.2486 9.28031 15.7931C8.59689 15.3376 8.03526 14.7326 7.64 14.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Ví MoMo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border rounded-md p-4 hover:shadow-md">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-3 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 7H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 11H10V17H6V11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 11H18V17H14V11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 7L12 3L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Chuyển khoản ngân hàng
                    </Label>
                  </div>
                </RadioGroup>
                {paymentMethod === "credit_card" && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="card_number">Số thẻ</Label>
                      <Input id="card_number" placeholder="1234 5678 9012 3456" maxLength={16} />
                    </div>
                    <div>
                      <Label htmlFor="card_name">Tên chủ thẻ</Label>
                      <Input id="card_name" placeholder="LUU NGOC THUONG" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="exp_date">Ngày hết hạn</Label>
                        <Input id="exp_date" placeholder="MM/YY" />
                      </div>
                      <div>
                        <Label htmlFor="cvv">Mã CVV</Label>
                        <Input id="cvv" placeholder="123" maxLength={3} />
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === "momo" && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-md">
                    <h4 className="font-medium mb-2">Hướng dẫn thanh toán qua MoMo:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Mở ứng dụng MoMo trên điện thoại</li>
                      <li>Quét mã QR hoặc tìm MakeYourTrip trong mục Dịch vụ</li>
                      <li>Nhập số tiền {tripData.totalPrice?.toLocaleString()}₫</li>
                      <li>Hoàn tất giao dịch</li>
                      <li>Quay lại trang web để xác nhận</li>
                    </ol>
                    <div className="mt-4 flex justify-center">
                      <div className="bg-white p-4 rounded-md inline-block">
                        <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          <path d="M30 30H35V35H30V30ZM35 35H40V40H35V35ZM40 40H45V45H40V40ZM45 45H50V50H45V45ZM50 50H55V55H50V50ZM55 55H60V60H55V55ZM60 60H65V65H60V60ZM65 65H70V70H65V65ZM30 35H25V40H30V35ZM30 45H35V50H30V45ZM30 55H35V60H30V55ZM30 65H35V70H30V65ZM40 30H45V35H40V30ZM50 30H55V35H50V30ZM60 30H65V35H60V30ZM70 30H75V35H70V30ZM70 40H75V45H70V40ZM70 50H75V55H70V50ZM70 60H75V65H70V60ZM35 70H40V75H35V70ZM45 70H50V75H45V70ZM55 70H60V75H55V70ZM65 70H70V75H65V70Z" fill="black"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === "bank_transfer" && (
                  <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <h4 className="font-medium mb-2">Thông tin chuyển khoản:</h4>
                    <ul className="space-y-2 text-sm">
                      <li><span className="font-medium">Ngân hàng:</span> Vietcombank</li>
                      <li><span className="font-medium">Số tài khoản:</span> 1234567890</li>
                      <li><span className="font-medium">Tên tài khoản:</span> CONG TY DU LICH MARCH MARCH</li>
                      <li><span className="font-medium">Số tiền:</span> {tripData.totalPrice?.toLocaleString()}₫</li>
                      <li>
                        <span className="font-medium">Nội dung:</span> TJ-{tripData.origin_id}{tripData.destination_id}-
                        {tripData.start_date && formatDate(tripData.start_date).replace(/\//g, "")}
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <p className="text-sm flex items-start">
                        <svg className="w-5 h-5 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản.
                          Sau khi chuyển, chụp màn hình và nhấn "Xác nhận thanh toán".
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="bg-gray-50 p-4">
                <CardTitle className="text-xl font-bold">Tóm tắt chuyến đi</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
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
                      {tripData.start_date && tripData.end_date
                        ? `${differenceInDays(
                            new Date(tripData.end_date),
                            new Date(tripData.start_date)
                          ) + 1} ngày`
                        : ""}
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
                    {attractions && attractions.length > 0 ? (
                      attractions.map((attr: any) => (
                        <div key={attr.id} className="flex justify-between">
                          <span className="text-base text-gray-600">{attr.name}:</span>
                          <span className="text-base font-medium text-gray-800">
                            {Number(attr.price).toLocaleString()}₫
                          </span>
                        </div>
                      ))
                    ) : null}
                    {tripData.additionalServices?.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Bảo hiểm:</span>
                        <span className="text-base font-medium text-gray-800">
                          {tripData.additionalServices.insurance.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    {tripData.additionalServices?.sim > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Sim 4G:</span>
                        <span className="text-base font-medium text-gray-800">
                          {tripData.additionalServices.sim.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    {tripData.additionalServices?.guide > 0 && (
                      <div className="flex justify-between">
                        <span className="text-base text-gray-600">Hướng dẫn viên:</span>
                        <span className="text-base font-medium text-gray-800">
                          {tripData.additionalServices.guide.toLocaleString()}₫
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold mt-3">
                      <span className="text-lg">Tổng tiền:</span>
                      <span className="text-xl text-primary">
                        {(
                          basePrice +
                          (attractions?.reduce((sum: number, attr: any) => sum + Number(attr.price), 0) || 0) +
                          (tripData.additionalServices?.insurance || 0) +
                          (tripData.additionalServices?.sim || 0) +
                          (tripData.additionalServices?.guide || 0)
                        ).toLocaleString()}₫
                      </span>
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
                      {tripData.selectedDepartureOption ? (
                        <div className="text-sm text-gray-600">
                          {transportationSummary?.depOption
                            ? `${transportationSummary.depOption.provider} - ${
                                transportationSummary.depOption.departure_flight_number
                              } ( ${transportationSummary.depOption.departure_time} - ${
                                transportationSummary.depOption.departure_arrival_time || "Chưa xác định"
                              } )`
                            : "Chưa có thông tin chiều đi."}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có thông tin chiều đi.</p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Hành lý:</span>{" "}
                        {transportationSummary?.depOption
                          ? transportationSummary.depOption.departure_baggage || "Chưa xác định"
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Chiều về:</p>
                      {tripData.selectedReturnOption ? (
                        <div className="text-sm text-gray-600">
                          {transportationSummary?.retOption
                            ? `${transportationSummary.retOption.provider} - ${
                                transportationSummary.retOption.return_flight_number
                              } ( ${transportationSummary.retOption.return_time} - ${
                                transportationSummary.retOption.return_arrival_time || "Chưa xác định"
                              } )`
                            : "Chưa có thông tin chiều về."}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Chưa có thông tin chiều về.</p>
                      )}
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Hành lý:</span>{" "}
                        {transportationSummary?.retOption
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

      <div className="flex justify-between p-6 pt-0">
        <Button variant="outline" onClick={() => setCurrentStep(4)} className="px-4 py-2">
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Quay lại
        </Button>
        <Button
          onClick={handlePaymentSubmit}
          disabled={isSubmitting}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-2"
        >
          {isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
          <svg
            className="w-5 h-5 ml-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 6L15 12L9 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}