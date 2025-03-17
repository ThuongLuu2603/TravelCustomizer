import { useState } from "react";
import { useTripContext } from "@/lib/trip-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export default function StepFive() {
  const { tripData, resetTripData } = useTripContext();
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Get destination information for confirmation message
  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    return format(new Date(date), "dd/MM/yyyy", { locale: vi });
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create trip in the backend
      const response = await apiRequest("POST", "/api/trips", {
        origin_id: tripData.originId,
        destination_id: tripData.destinationId,
        transportation_type_id: tripData.transportationTypeId,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        adults: tripData.adults,
        children: tripData.children,
        total_price: tripData.totalPrice,
        status: "confirmed",
      });
      
      const createdTrip = await response.json();
      
      // Add accommodations to trip
      if (tripData.selectedAccommodations && tripData.accommodations) {
        for (let i = 0; i < tripData.selectedAccommodations.length; i++) {
          const accommodationId = tripData.selectedAccommodations[i];
          const accommodationData = tripData.accommodations[i];
          
          if (accommodationId && accommodationData) {
            await apiRequest("POST", `/api/trips/${createdTrip.id}/accommodations`, {
              accommodation_id: accommodationId,
              location: accommodationData.location,
              check_in_date: accommodationData.checkIn,
              check_out_date: accommodationData.checkOut,
            });
          }
        }
      }
      
      // Add transportation to trip
      if (tripData.selectedTransportation) {
        await apiRequest("POST", `/api/trips/${createdTrip.id}/transportations`, {
          transportation_option_id: tripData.selectedTransportation,
        });
      }
      
      // Add attractions to trip
      if (tripData.selectedAttractions && tripData.selectedAttractions.length > 0) {
        for (const attraction of tripData.selectedAttractions) {
          await apiRequest("POST", `/api/trips/${createdTrip.id}/attractions`, {
            attraction_id: attraction.attractionId,
            day: attraction.day,
            time_slot: attraction.timeSlot || "morning",
          });
        }
      }
      
      toast({
        title: "Thanh toán thành công",
        description: "Chuyến đi của bạn đã được xác nhận",
      });
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Lỗi thanh toán",
        description: "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  const handleReturnHome = () => {
    resetTripData();
    setLocation("/");
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 p-10 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Đặt chỗ thành công!</h2>
          
          <p className="text-neutral-600 mb-4">
            Cảm ơn bạn đã đặt chuyến đi đến {destinationLocation?.name}. Chúng tôi đã gửi xác nhận đặt chỗ qua email của bạn.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <p className="font-medium text-neutral-800 mb-1">Thông tin chuyến đi:</p>
            <p className="text-neutral-600 text-sm mb-1">
              <span className="font-medium">Mã đặt chỗ:</span> TJ-{Math.floor(100000 + Math.random() * 900000)}
            </p>
            <p className="text-neutral-600 text-sm mb-1">
              <span className="font-medium">Ngày:</span> {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
            </p>
            <p className="text-neutral-600 text-sm">
              <span className="font-medium">Hành khách:</span> {tripData.adults} người lớn, {tripData.children} trẻ em
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleReturnHome} className="bg-primary hover:bg-blue-700">
              Về trang chủ
            </Button>
            <Button variant="outline">
              Xem chi tiết đặt chỗ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">Bước 5: Thanh toán</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue="credit_card" 
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M6 15H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M11 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Thẻ tín dụng / Ghi nợ
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="momo" id="momo" />
                    <Label htmlFor="momo" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-2 text-pink-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="12" fill="currentColor" fillOpacity="0.1" />
                        <path d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" fill="currentColor" />
                        <path d="M16 15C15.4565 15.5981 14.7637 16.0627 13.9871 16.3482C13.2104 16.6337 12.3789 16.7323 11.5621 16.6353C10.7454 16.5382 9.96372 16.2486 9.28031 15.7931C8.59689 15.3376 8.03526 14.7326 7.64 14.02" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      Ví MoMo
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex items-center cursor-pointer">
                      <svg className="w-8 h-8 mr-2 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                
                {/* Credit card form */}
                {paymentMethod === "credit_card" && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="card_number">Số thẻ</Label>
                      <Input id="card_number" placeholder="1234 5678 9012 3456" maxLength={16} />
                    </div>
                    
                    <div>
                      <Label htmlFor="card_name">Tên chủ thẻ</Label>
                      <Input id="card_name" placeholder="NGUYEN VAN A" />
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
                
                {/* MoMo instructions */}
                {paymentMethod === "momo" && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-md">
                    <h4 className="font-medium mb-2">Hướng dẫn thanh toán qua MoMo:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Mở ứng dụng MoMo trên điện thoại của bạn</li>
                      <li>Quét mã QR bên dưới hoặc tìm kiếm TravelJourney trong mục Dịch vụ</li>
                      <li>Nhập số tiền {tripData.totalPrice?.toLocaleString()}₫</li>
                      <li>Hoàn tất giao dịch trên ứng dụng MoMo</li>
                      <li>Quay lại trang web này để xác nhận</li>
                    </ol>
                    
                    <div className="mt-4 flex justify-center">
                      <div className="bg-white p-4 rounded-md inline-block">
                        <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white"/>
                          <path d="M30 30H35V35H30V30ZM35 35H40V40H35V35ZM40 40H45V45H40V40ZM45 45H50V50H45V45ZM50 50H55V55H50V50ZM55 55H60V60H55V55ZM60 60H65V65H60V60ZM65 65H70V70H65V65ZM30 35H25V40H30V35ZM30 45H35V50H30V45ZM30 55H35V60H30V55ZM30 65H35V70H30V65ZM40 30H45V35H40V30ZM50 30H55V35H50V30ZM60 30H65V35H60V30ZM70 30H75V35H70V30ZM70 40H75V45H70V40ZM70 50H75V55H70V50ZM70 60H75V65H70V60ZM35 70H40V75H35V70ZM45 70H50V75H45V70ZM55 70H60V75H55V70ZM65 70H70V75H65V70Z" fill="black"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bank transfer instructions */}
                {paymentMethod === "bank_transfer" && (
                  <div className="mt-6 p-4 bg-green-50 rounded-md">
                    <h4 className="font-medium mb-2">Thông tin chuyển khoản:</h4>
                    <ul className="space-y-2 text-sm">
                      <li><span className="font-medium">Ngân hàng:</span> Vietcombank</li>
                      <li><span className="font-medium">Số tài khoản:</span> 1234567890</li>
                      <li><span className="font-medium">Tên tài khoản:</span> CONG TY DU LICH TRAVEL JOURNEY</li>
                      <li><span className="font-medium">Số tiền:</span> {tripData.totalPrice?.toLocaleString()}₫</li>
                      <li><span className="font-medium">Nội dung:</span> TJ-{tripData.originId}{tripData.destinationId}-{formatDate(tripData.startDate)?.replace(/\//g, '')}</li>
                    </ul>
                    
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <p className="text-sm flex items-start">
                        <svg className="w-5 h-5 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          Vui lòng chuyển khoản đúng số tiền và nội dung chuyển khoản.
                          Sau khi chuyển khoản, vui lòng chụp ảnh màn hình và nhấn "Xác nhận thanh toán".
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Order summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Phương tiện:</span>
                    <span className="font-medium">{(tripData.totalPrice || 0) * 0.3}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Khách sạn:</span>
                    <span className="font-medium">{(tripData.totalPrice || 0) * 0.5}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Điểm tham quan:</span>
                    <span className="font-medium">{(tripData.totalPrice || 0) * 0.15}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Dịch vụ bổ sung:</span>
                    <span className="font-medium">{(tripData.totalPrice || 0) * 0.05}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex justify-between font-medium">
                      <span>Tổng tiền:</span>
                      <span className="text-lg text-primary">{tripData.totalPrice?.toLocaleString()}₫</span>
                    </div>
                  </div>
                  
                  <div className="pt-3">
                    <Button
                      onClick={handlePaymentSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-blue-700 py-6"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận thanh toán"
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-neutral-500 text-center">
                    Bằng việc tiếp tục, bạn đồng ý với{" "}
                    <Link href="/terms">
                      <a className="text-blue-600 hover:underline">điều khoản</a>
                    </Link>{" "}
                    và{" "}
                    <Link href="/privacy">
                      <a className="text-blue-600 hover:underline">chính sách</a>
                    </Link>{" "}
                    của chúng tôi.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
