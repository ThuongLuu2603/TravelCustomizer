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
  const [totalPrice, setTotalPrice] = useState<number>(tripData.totalPrice || 0);
  const [additionalServices, setAdditionalServices] = useState<{
    insurance: number;
    sim: number;
    guide: number;
  }>({ insurance: 0, sim: 0, guide: 0 });

  // Get locations
  const { data: originLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.originId}`],
    enabled: !!tripData.originId,
  });
  
  const { data: destinationLocation } = useQuery({
    queryKey: [`/api/locations/${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
  });

  // Get transportation
  const { data: transportationOption } = useQuery({
    queryKey: [`/api/transportation-options?originId=${tripData.originId}&destinationId=${tripData.destinationId}`],
    enabled: !!(tripData.originId && tripData.destinationId && tripData.selectedTransportation),
    select: (data) => data.find((option: any) => option.id === tripData.selectedTransportation),
  });

  // Get accommodations
  const { data: accommodations } = useQuery({
    queryKey: [`/api/accommodations?locationId=${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
    select: (data) => data.filter((accom: any) => 
      tripData.selectedAccommodations?.includes(accom.id)
    ),
  });

  // Get attractions
  const { data: attractions } = useQuery({
    queryKey: [`/api/attractions?locationId=${tripData.destinationId}`],
    enabled: !!tripData.destinationId,
    select: (data) => data.filter((attr: any) => 
      tripData.selectedAttractions?.some(item => item.attractionId === attr.id)
    ),
  });

  // Setup form
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

  // Calculate total price including additional services
  useEffect(() => {
    let price = tripData.totalPrice || 0;
    
    // Add additional services
    price += additionalServices.insurance + additionalServices.sim + additionalServices.guide;
    
    setTotalPrice(price);
  }, [tripData.totalPrice, additionalServices]);

  // Format date for display
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: vi });
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (tripData.startDate && tripData.endDate) {
      const start = new Date(tripData.startDate);
      const end = new Date(tripData.endDate);
      return differenceInDays(end, start) + 1;
    }
    return 0;
  };

  // Handle additional services changes
  const onServiceChange = (service: string, checked: boolean) => {
    const tripDuration = getTripDuration();
    const adults = tripData.adults || 1;
    const children = tripData.children || 0;
    const totalPeople = adults + children;
    
    if (service === 'insurance') {
      setAdditionalServices(prev => ({
        ...prev,
        insurance: checked ? 120000 * totalPeople : 0
      }));
    } else if (service === 'sim') {
      setAdditionalServices(prev => ({
        ...prev,
        sim: checked ? 100000 * adults : 0
      }));
    } else if (service === 'guide') {
      setAdditionalServices(prev => ({
        ...prev,
        guide: checked ? 1500000 * tripDuration : 0
      }));
    }
  };

  // Handle form submission
  const onSubmit = (data: BookingFormValues) => {
    // Update trip data with booking info and final price
    updateTripData({
      totalPrice,
      bookingInfo: data
    });
    
    // Go to next step
    setCurrentStep(5);
  };

  // Handle back button click
  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">Bước 4: Xác nhận thông tin và dịch vụ bổ sung</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin người đặt</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Input placeholder="Nhập địa chỉ email" {...field} />
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
                            <Input placeholder="Nhập yêu cầu đặc biệt (nếu có)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <h3 className="font-medium text-lg pt-2">Dịch vụ bổ sung</h3>
                    
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="buyInsurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange('insurance', checked === true);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">Bảo hiểm du lịch</FormLabel>
                              <p className="text-sm text-neutral-600">
                                Bảo vệ bạn trong suốt chuyến đi - 120.000₫/người
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="buySim"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange('sim', checked === true);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">Sim 4G data (không giới hạn)</FormLabel>
                              <p className="text-sm text-neutral-600">
                                Kết nối mọi lúc mọi nơi - 100.000₫/người lớn
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="needGuide"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  onServiceChange('guide', checked === true);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">Hướng dẫn viên</FormLabel>
                              <p className="text-sm text-neutral-600">
                                Dịch vụ hướng dẫn viên chuyên nghiệp - 1.500.000₫/ngày
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* This button is for form submission but we'll hide it and use the one from bottom nav */}
                    <button type="submit" className="hidden">Submit</button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          {/* Trip summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tóm tắt chuyến đi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trip overview */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Hành trình:</span>
                    <span className="font-medium">
                      {originLocation?.name} - {destinationLocation?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Ngày đi:</span>
                    <span className="font-medium">
                      {tripData.startDate && formatDate(tripData.startDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Ngày về:</span>
                    <span className="font-medium">
                      {tripData.endDate && formatDate(tripData.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Số ngày:</span>
                    <span className="font-medium">{getTripDuration()} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Số hành khách:</span>
                    <span className="font-medium">
                      {tripData.adults} người lớn, {tripData.children} trẻ em
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <h4 className="font-medium mb-2">Phương tiện di chuyển</h4>
                  {transportationOption && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{transportationOption.provider}</p>
                        <p className="text-neutral-600">
                          {transportationOption.departure_time} - {transportationOption.arrival_time} ({transportationOption.duration})
                        </p>
                      </div>
                      <div className="text-primary font-medium">
                        {transportationOption.price.toLocaleString()}₫
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <h4 className="font-medium mb-2">Lưu trú ({accommodations?.length} khách sạn)</h4>
                  {accommodations && accommodations.map((accom: any, index: number) => {
                    // Calculate nights for this accommodation
                    let nights = 0;
                    if (tripData.accommodations && tripData.accommodations[index]) {
                      const { checkIn, checkOut } = tripData.accommodations[index];
                      if (checkIn && checkOut) {
                        nights = differenceInDays(new Date(checkOut), new Date(checkIn));
                      }
                    }
                    
                    return (
                      <div key={accom.id} className="flex items-center justify-between text-sm mb-2">
                        <div className="flex-1">
                          <p className="font-medium">{accom.name}</p>
                          <p className="text-neutral-600">{accom.address} ({nights} đêm)</p>
                        </div>
                        <div className="text-primary font-medium">
                          {(accom.price_per_night * nights).toLocaleString()}₫
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <h4 className="font-medium mb-2">Điểm tham quan ({attractions?.length || 0})</h4>
                  {attractions && attractions.map((attr: any) => (
                    <div key={attr.id} className="flex items-center justify-between text-sm mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{attr.name}</p>
                        <p className="text-neutral-600">{attr.duration}</p>
                      </div>
                      <div className="text-primary font-medium">
                        {attr.price.toLocaleString()}₫
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Additional services summary */}
                {(additionalServices.insurance > 0 || additionalServices.sim > 0 || additionalServices.guide > 0) && (
                  <div className="border-t border-neutral-200 pt-3 mt-3">
                    <h4 className="font-medium mb-2">Dịch vụ bổ sung</h4>
                    
                    {additionalServices.insurance > 0 && (
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Bảo hiểm du lịch</p>
                          <p className="text-neutral-600">
                            {tripData.adults && tripData.children ? tripData.adults + tripData.children : 1} người
                          </p>
                        </div>
                        <div className="text-primary font-medium">
                          {additionalServices.insurance.toLocaleString()}₫
                        </div>
                      </div>
                    )}
                    
                    {additionalServices.sim > 0 && (
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Sim 4G data</p>
                          <p className="text-neutral-600">
                            {tripData.adults || 1} người lớn
                          </p>
                        </div>
                        <div className="text-primary font-medium">
                          {additionalServices.sim.toLocaleString()}₫
                        </div>
                      </div>
                    )}
                    
                    {additionalServices.guide > 0 && (
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Hướng dẫn viên</p>
                          <p className="text-neutral-600">
                            {getTripDuration()} ngày
                          </p>
                        </div>
                        <div className="text-primary font-medium">
                          {additionalServices.guide.toLocaleString()}₫
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Total price */}
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-lg">Tổng tiền:</span>
                    <span className="text-xl text-primary">{totalPrice.toLocaleString()}₫</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Đã bao gồm thuế và phí</p>
                </div>
              </CardContent>
            </Card>
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
          onClick={form.handleSubmit(onSubmit)}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-2"
        >
          Tiếp tục đến thanh toán
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
    </div>
  );
}
