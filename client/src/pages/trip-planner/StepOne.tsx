import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useTripContext } from "@/lib/trip-context";
import { addDays, differenceInDays } from "date-fns";

interface Accommodation {
  id: number;
  trip_id: number;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  location: number | undefined;
}

export default function StepOne() {
  const { toast } = useToast();
  const { tripData, updateTripData, setCurrentStep } = useTripContext();

  // Form state
  const [origin, setOrigin] = useState<string>(
    tripData.originId?.toString() || ""
  );
  const [destination, setDestination] = useState<string>(
    tripData.destinationId?.toString() || ""
  );
  const [transportationType, setTransportationType] = useState<string>(
    tripData.transportationTypeId?.toString() || ""
  );
  const [adults, setAdults] = useState<string>(
    tripData.adults?.toString() || "1"
  );
  const [children, setChildren] = useState<string>(
    tripData.children?.toString() || "0"
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    tripData.startDate ? new Date(tripData.startDate) : undefined
  );
  const [returnDate, setReturnDate] = useState<Date | undefined>(
    tripData.endDate ? new Date(tripData.endDate) : undefined
  );

  // Accommodations state
  const [accommodations, setAccommodations] = useState<Accommodation[]>(
    tripData.accommodations?.map((a: any) => ({
      id: a.id,
      trip_id: a.trip_id || 1,
      checkIn: a.checkIn ? new Date(a.checkIn) : undefined,
      checkOut: a.checkOut ? new Date(a.checkOut) : undefined,
      location: a.location,
    })) || [
      {
        id: 1,
        trip_id: 1,
        location: undefined,
        checkIn: undefined,
        checkOut: undefined,
      },
    ]
  );

  // Fetch data using useQuery
  const {
    data: origins = [], // Default to empty array if data is undefined
  } = useQuery({
    queryKey: ["/api/locations?type=origin"],
  });

  const {
    data: destinations = [], // Default to empty array if data is undefined
  } = useQuery({
    queryKey: ["/api/locations?type=destination"],
  });

  const {
    data: transportationTypes = [], // Default to empty array if data is undefined
  } = useQuery({
    queryKey: ["/api/transportation-types"],
  });

  // Handle adding accommodation
  const addAccommodation = () => {
    const newId =
      accommodations.length > 0
        ? Math.max(...accommodations.map((a) => a.id)) + 1
        : 1;

    setAccommodations([
      ...accommodations,
      {
        id: newId,
        trip_id: 1,
        location: undefined,
        checkIn: undefined,
        checkOut: undefined,
      },
    ]);
  };

  // Handle removing accommodation
  const removeAccommodation = (id: number) => {
    setAccommodations(accommodations.filter((a) => a.id !== id));
  };

  // Update accommodation field
  const updateAccommodation = (id: number, field: string, value: any) => {
    setAccommodations(
      accommodations.map((a) =>
        a.id === id ? { ...a, [field]: value instanceof Date ? value : undefined } : a
      )
    );
  };

  // Validate form
  const validateForm = () => {
    if (!origin) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm xuất phát",
        variant: "destructive",
      });
      return false;
    }

    if (!destination) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn điểm đến",
        variant: "destructive",
      });
      return false;
    }

    if (!transportationType) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phương tiện di chuyển",
        variant: "destructive",
      });
      return false;
    }

    if (!departureDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày đi",
        variant: "destructive",
      });
      return false;
    }

    if (!returnDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày về",
        variant: "destructive",
      });
      return false;
    }

    if (returnDate <= departureDate) {
      toast({
        title: "Lỗi",
        description: "Ngày về phải sau ngày đi",
        variant: "destructive",
      });
      return false;
    }

    // Validate accommodations
    for (const accom of accommodations) {
      if (!accom.location) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn điểm lưu trú",
          variant: "destructive",
        });
        return false;
      }

      // Đảm bảo checkIn và checkOut không undefined, sử dụng giá trị mặc định nếu cần
      const effectiveCheckIn = accom.checkIn || departureDate;
      const effectiveCheckOut = accom.checkOut || returnDate;

      if (!effectiveCheckIn) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ngày nhận phòng",
          variant: "destructive",
        });
        return false;
      }

      if (!effectiveCheckOut) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ngày trả phòng",
          variant: "destructive",
        });
        return false;
      }

      if (effectiveCheckOut <= effectiveCheckIn) {
        toast({
          title: "Lỗi",
          description: "Ngày trả phòng phải sau ngày nhận phòng",
          variant: "destructive",
        });
        return false;
      }

      if (effectiveCheckIn < departureDate) {
        toast({
          title: "Lỗi",
          description: "Ngày nhận phòng không thể trước ngày đi",
          variant: "destructive",
        });
        return false;
      }

      if (effectiveCheckOut > returnDate) {
        toast({
          title: "Lỗi",
          description: "Ngày trả phòng không thể sau ngày về",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateForm()) {
      const formatDate = (date: Date | undefined) =>
        date ? date.toLocaleDateString("en-CA") : undefined;

      // Sử dụng origins và destinations
      const originLocation = origins.find((loc: any) => loc.id === parseInt(origin));
      const destinationLocation = destinations.find((loc: any) => loc.id === parseInt(destination));
      const originName = originLocation ? originLocation.name : origin;
      const destinationName = destinationLocation ? destinationLocation.name : destination;

      // Đảm bảo checkIn và checkOut không undefined
      const formattedAccommodations = accommodations.map((accom) => ({
        ...accom,
        checkIn: accom.checkIn || departureDate, // Sử dụng departureDate làm giá trị mặc định
        checkOut: accom.checkOut || returnDate, // Sử dụng returnDate làm giá trị mặc định
      })).map((accom) => ({
        ...accom,
        checkIn: formatDate(accom.checkIn),
        checkOut: formatDate(accom.checkOut),
      }));

      const tripPayload = {
        trip: {
          user_id: 1,
          name: `Chuyến đi từ ${originName} đến ${destinationName}`,
          origin_id: parseInt(origin),
          destination_id: parseInt(destination),
          start_date: departureDate ? formatDate(departureDate) : undefined,
          end_date: returnDate ? formatDate(returnDate) : undefined,
          total_price: 0,
          status: "planning",
          adults: parseInt(adults || "0"),
          children: parseInt(children || "0"),
        },
        accommodations: formattedAccommodations.map((accom) => ({
          checkIn: accom.checkIn,
          checkOut: accom.checkOut,
          location: parseInt(accom.location?.toString() || "0"),
        })),
      };

      try {
        const response = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Không thể tạo chuyến đi.");
        }

        const createdTrip = await response.json();
        console.log("Created trip:", createdTrip);

        updateTripData({
          tripId: createdTrip.id,
          originId: parseInt(origin),
          destinationId: parseInt(destination),
          transportationTypeId: parseInt(transportationType),
          adults: parseInt(adults || "0"),
          children: parseInt(children || "0"),
          startDate: departureDate ? formatDate(departureDate) : undefined,
          endDate: returnDate ? formatDate(returnDate) : undefined,
          accommodations: formattedAccommodations,
        });

        setCurrentStep(2);
      } catch (error) {
        console.error("Error creating trip:", error);
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tạo chuyến đi. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    }
  };

  // Set default dates if needed
  useEffect(() => {
    if (!departureDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDepartureDate(tomorrow);
    }

    if (departureDate && !returnDate) {
      const defaultReturnDate = new Date(departureDate);
      defaultReturnDate.setDate(defaultReturnDate.getDate() + 5);
      setReturnDate(defaultReturnDate);
    }

    // Cập nhật checkIn và checkOut cho accommodations
    if (departureDate && returnDate && accommodations.length > 0) {
      const updatedAccommodations = accommodations.map((accom, index, arr) => {
        const newAccom = { ...accom };
        if (!newAccom.checkIn && index === 0) {
          newAccom.checkIn = new Date(departureDate);
        }
        if (!newAccom.checkOut && index === arr.length - 1) {
          newAccom.checkOut = new Date(returnDate);
        }
        return newAccom;
      });
      setAccommodations(updatedAccommodations);
    }
  }, [departureDate, returnDate]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="p-6">
        <h2 className="font-semibold text-xl mb-6 pb-2 border-b border-neutral-200">
          Bước 1: Thông tin cơ bản chuyến đi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Origin and Destination */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label
                className="block text-sm font-medium text-neutral-700 mb-1"
                htmlFor="origin"
              >
                Điểm xuất phát
              </label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger id="origin" className="pl-9">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <SelectValue placeholder="Chọn điểm xuất phát" />
                </SelectTrigger>
                <SelectContent>
                  {origins.map((location: any) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                    >
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <label
                className="block text-sm font-medium text-neutral-700 mb-1"
                htmlFor="destination"
              >
                Điểm đến
              </label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger id="destination" className="pl-9">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <SelectValue placeholder="Chọn điểm đến" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((location: any) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                    >
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transportation and Guests */}
          <div>
            <label
              className="block text-sm font-medium text-neutral-700 mb-1"
              htmlFor="transportation"
            >
              Phương tiện di chuyển
            </label>
            <Select
              value={transportationType}
              onValueChange={setTransportationType}
            >
              <SelectTrigger id="transportation" className="pl-9">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M8 17H16M8 17C8 18.1046 7.10457 19 6 19C4.89543 19 4 18.1046 4 17M8 17L8.23874 16.1422C8.7322 14.4673 10.299 13.3333 12.0625 13.3333H12.9375C14.701 13.3333 16.2678 14.4673 16.7613 16.1422L17 17M16 17C16 18.1046 16.8954 19 18 19C19.1046 19 20 18.1046 20 17M20 10L19.38 6.54891C19.1556 5.15299 17.9617 4.12567 16.5481 4.12567H15C15 3.50324 14.4968 3 13.8743 3H11.1257C10.5032 3 10 3.50324 10 4.12567H7.45185C6.03835 4.12567 4.84361 5.15299 4.62003 6.54891L4 10M20 10H4M20 10V12C20 12.5523 19.5523 13 19 13H18C17.4477 13 17 12.5523 17 12V11H7V12C7 12.5523 6.55228 13 6 13H5C4.44772 13 4 12.5523 4 12V10"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <SelectValue placeholder="Chọn phương tiện" />
              </SelectTrigger>
              <SelectContent>
                {transportationTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-neutral-700 mb-1"
              htmlFor="guests"
            >
              Số lượng khách
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Select value={adults} onValueChange={setAdults}>
                  <SelectTrigger id="adults" className="pl-9">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <SelectValue placeholder="Người lớn" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} người lớn
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Select value={children} onValueChange={setChildren}>
                  <SelectTrigger id="children" className="pl-9">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <SelectValue placeholder="Trẻ em" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} trẻ em
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              date={departureDate}
              setDate={setDepartureDate}
              label="Ngày đi"
              placeholder="Chọn ngày đi"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              minDate={new Date()} // Can't select dates in the past
            />
            <DatePicker
              date={returnDate}
              setDate={setReturnDate}
              label="Ngày về"
              placeholder="Chọn ngày về"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              minDate={departureDate ? addDays(departureDate, 1) : undefined} // Can't select dates before departure
            />
          </div>
        </div>

        {/* Accommodations */}
        <h3 className="font-medium text-lg mb-4">Điểm lưu trú</h3>
        <div id="accommodations-container">
          {accommodations.map((accommodation, index) => (
            <div
              key={accommodation.id}
              className="accommodation-item bg-neutral-100 p-4 rounded-lg mb-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Điểm lưu trú {index + 1}</h4>
                {accommodations.length > 1 && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeAccommodation(accommodation.id)}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Xóa
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label
                    className="block text-sm font-medium text-neutral-700 mb-1"
                    htmlFor={`accom-${accommodation.id}-location`}
                  >
                    Chọn điểm
                  </label>
                  <Select
                    value={accommodation.location?.toString() || ""}
                    onValueChange={(value) =>
                      updateAccommodation(
                        accommodation.id,
                        "location",
                        parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger
                      id={`accom-${accommodation.id}-location`}
                      className="pl-9"
                    >
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <SelectValue placeholder="Chọn Địa Điểm Lưu Trú" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((location: any) => (
                        <SelectItem
                          key={location.id}
                          value={location.id.toString()}
                        >
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <DatePicker
                    date={accommodation.checkIn}
                    setDate={(date) =>
                      updateAccommodation(
                        accommodation.id,
                        "checkIn",
                        date
                      )
                    }
                    label="Ngày nhận phòng"
                    placeholder="Chọn ngày nhận phòng"
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                    }
                    minDate={departureDate}
                    maxDate={returnDate}
                  />
                </div>
                <div>
                  <DatePicker
                    date={accommodation.checkOut}
                    setDate={(date) =>
                      updateAccommodation(
                        accommodation.id,
                        "checkOut",
                        date
                      )
                    }
                    label="Ngày trả phòng"
                    placeholder="Chọn ngày trả phòng"
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    }
                    minDate={departureDate}
                    maxDate={returnDate}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            className="text-primary border-primary hover:bg-primary-foreground"
            onClick={addAccommodation}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Thêm điểm lưu trú
          </Button>
        </div>
      </div>

      {/* Show trip duration if dates are selected */}
      {departureDate && returnDate && (
        <div className="px-6 pb-4 pt-2">
          <div className="bg-blue-50 p-3 rounded-md text-sm">
            <span className="font-medium">Thời gian chuyến đi: </span>
            {differenceInDays(returnDate, departureDate)} ngày{" "}
            {differenceInDays(returnDate, departureDate) + 1 > 1
              ? `(${differenceInDays(returnDate, departureDate) + 1} đêm)`
              : ""}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex justify-end p-6 pt-2">
        <Button
          onClick={handleSubmit}
          className="bg-primary hover:bg-blue-700 text-white px-6 py-5 rounded-md font-medium"
        >
          Tiếp tục
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