import {
  locations, type Location, type InsertLocation,
  transportationTypes, type TransportationType, type InsertTransportationType,
  transportationOptions, type TransportationOption, type InsertTransportationOption,
  accommodationTypes, type AccommodationType, type InsertAccommodationType,
  accommodations, type Accommodation, type InsertAccommodation,
  attractions, type Attraction, type InsertAttraction,
  trips, type Trip, type InsertTrip,
  tripAccommodations, type TripAccommodation, type InsertTripAccommodation,
  tripTransportations, type TripTransportation, type InsertTripTransportation,
  tripAttractions, type TripAttraction, type InsertTripAttraction,
  users, type User, type InsertUser
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getLocations(type?: string): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;

  getTransportationTypes(): Promise<TransportationType[]>;
  getTransportationOptions(originId: number, destinationId: number): Promise<TransportationOption[]>;
  getTransportationOption(id: number): Promise<TransportationOption | undefined>;
  createTransportationOption(option: InsertTransportationOption): Promise<TransportationOption>;

  getAccommodationTypes(): Promise<AccommodationType[]>;
  getAccommodations(locationId: number): Promise<Accommodation[]>;
  getAccommodation(id: number): Promise<Accommodation | undefined>;
  createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation>;

  getAttractions(locationId: number): Promise<Attraction[]>;
  getAttraction(id: number): Promise<Attraction | undefined>;
  createAttraction(attraction: InsertAttraction): Promise<Attraction>;

  getTrips(userId?: number): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;

  getTripAccommodations(tripId: number): Promise<TripAccommodation[]>;
  addTripAccommodation(tripAccommodation: InsertTripAccommodation): Promise<TripAccommodation>;
  removeTripAccommodation(id: number): Promise<boolean>;

  getTripTransportations(tripId: number): Promise<TripTransportation[]>;
  addTripTransportation(tripTransportation: InsertTripTransportation): Promise<TripTransportation>;
  updateTripTransportation(id: number, tripTransportation: Partial<InsertTripTransportation>): Promise<TripTransportation | undefined>;

  getTripAttractions(tripId: number): Promise<TripAttraction[]>;
  addTripAttraction(tripAttraction: InsertTripAttraction): Promise<TripAttraction>;
  removeTripAttraction(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private locations: Map<number, Location> = new Map();
  private transportationTypes: Map<number, TransportationType> = new Map();
  private transportationOptions: Map<number, TransportationOption> = new Map();
  private accommodationTypes: Map<number, AccommodationType> = new Map();
  private accommodations: Map<number, Accommodation> = new Map();
  private attractions: Map<number, Attraction> = new Map();
  private trips: Map<number, Trip> = new Map();
  private tripAccommodations: Map<number, TripAccommodation> = new Map();
  private tripTransportations: Map<number, TripTransportation> = new Map();
  private tripAttractions: Map<number, TripAttraction> = new Map();

  private userCurrentId: number = 1;
  private locationCurrentId: number = 1;
  private transportationTypeCurrentId: number = 1;
  private transportationOptionCurrentId: number = 1;
  private accommodationTypeCurrentId: number = 1;
  private accommodationCurrentId: number = 1;
  private attractionCurrentId: number = 1;
  private tripCurrentId: number = 1;
  private tripAccommodationCurrentId: number = 1;
  private tripTransportationCurrentId: number = 1;
  private tripAttractionCurrentId: number = 1;

  constructor() {
    this.initializeData().catch(err => {
      console.error("Error initializing data:", err);
    });
  }

  private async initializeData(): Promise<void> {
    console.log("Initializing data...");

    // Transportation Types
    const plane = await this.createTransportationType({ name: "Máy bay", icon: "bxs-plane" });
    const train = await this.createTransportationType({ name: "Tàu hỏa", icon: "bxs-train" });
    const bus = await this.createTransportationType({ name: "Xe khách", icon: "bxs-bus" });
    const car = await this.createTransportationType({ name: "Xe riêng", icon: "bxs-car" });
    console.log("Transportation types:", Array.from(this.transportationTypes.values()));

    // Locations
    const haNoi = await this.createLocation({ 
      name: "Hà Nội", 
      type: "origin", 
      description: "Thủ đô của Việt Nam",
      image_url: ""
    });
    const hoChiMinh = await this.createLocation({ 
      name: "Hồ Chí Minh", 
      type: "origin", 
      description: "Thành phố lớn nhất Việt Nam",
      image_url: ""
    });
    const daNang = await this.createLocation({ 
      name: "Đà Nẵng", 
      type: "origin", 
      description: "Thành phố biển miền Trung",
      image_url: ""
    });
    const phuQuoc = await this.createLocation({ 
      name: "Phú Quốc", 
      type: "destination", 
      description: "Đảo ngọc của Việt Nam",
      image_url: ""
    });
    const daLat = await this.createLocation({ 
      name: "Đà Lạt", 
      type: "destination", 
      description: "Thành phố mộng mơ",
      image_url: ""
    });
    const nhaTrang = await this.createLocation({ 
      name: "Nha Trang", 
      type: "destination", 
      description: "Thành phố biển nổi tiếng",
      image_url: ""
    });
    const haLong = await this.createLocation({ 
      name: "Hạ Long", 
      type: "destination", 
      description: "Vịnh Hạ Long kỳ quan thiên nhiên",
      image_url: ""
    });
    console.log("Locations:", Array.from(this.locations.values()));

    // Transportation Options
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: hoChiMinh.id,
      destination_id: phuQuoc.id,
      departure_flight_number: "VN123",
      departure_time: "08:00",
      departure_arrival_time: "09:15",
      departure_baggage: "20kg",
      return_flight_number: "VN456",
      return_time: "17:30",
      return_arrival_time: "18:45",
      return_baggage: "20kg",
      price: 2800000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: hoChiMinh.id,
      destination_id: phuQuoc.id,
      departure_flight_number: "VJ789",
      departure_time: "10:30",
      departure_arrival_time: "11:45",
      departure_baggage: "7kg",
      return_flight_number: "VJ790",
      return_time: "19:00",
      return_arrival_time: "20:15",
      return_baggage: "7kg",
      price: 1990000,
      is_recommended: true,
      price_difference: -810000,
      features: ["Bay thẳng"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: hoChiMinh.id,
      destination_id: phuQuoc.id,
      departure_flight_number: "QH123",
      departure_time: "14:00",
      departure_arrival_time: "15:15",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH124",
      return_time: "21:00",
      return_arrival_time: "22:15",
      return_baggage: "30kg (Thương gia)",
      price: 3500000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: haNoi.id,
      destination_id: phuQuoc.id,
      departure_flight_number: "VJ123",
      departure_time: "12:30",
      departure_arrival_time: "14:40",
      departure_baggage: "7kg",
      return_flight_number: "VJ124",
      return_time: "15:00",
      return_arrival_time: "17:10",
      return_baggage: "7kg",
      price: 2000000,
      is_recommended: true,
      price_difference: -500000,
      features: ["Bay thẳng", "Hành lý 7kg"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: haNoi.id,
      destination_id: phuQuoc.id,
      departure_flight_number: "QH456",
      departure_time: "15:45",
      departure_arrival_time: "18:05",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH457",
      return_time: "19:00",
      return_arrival_time: "21:20",
      return_baggage: "30kg (Thương gia)",
      price: 3700000,
      is_recommended: false,
      price_difference: 1200000,
      features: ["Bay thẳng", "Hạng thương gia", "Hành lý 30kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: hoChiMinh.id,
      destination_id: daLat.id,
      departure_flight_number: "VN138",
      departure_time: "07:30",
      departure_arrival_time: "08:25",
      departure_baggage: "20kg",
      return_flight_number: "VN139",
      return_time: "16:00",
      return_arrival_time: "16:55",
      return_baggage: "20kg",
      price: 2500000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: hoChiMinh.id,
      destination_id: daLat.id,
      departure_flight_number: "VJ362",
      departure_time: "09:15",
      departure_arrival_time: "10:10",
      departure_baggage: "7kg",
      return_flight_number: "VJ363",
      return_time: "18:30",
      return_arrival_time: "19:25",
      return_baggage: "7kg",
      price: 1800000,
      is_recommended: true,
      price_difference: -700000,
      features: ["Bay thẳng"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: hoChiMinh.id,
      destination_id: daLat.id,
      departure_flight_number: "QH202",
      departure_time: "13:00",
      departure_arrival_time: "13:55",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH203",
      return_time: "20:00",
      return_arrival_time: "20:55",
      return_baggage: "30kg (Thương gia)",
      price: 3200000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: haNoi.id,
      destination_id: daLat.id,
      departure_flight_number: "VN157",
      departure_time: "08:00",
      departure_arrival_time: "09:50",
      departure_baggage: "20kg",
      return_flight_number: "VN158",
      return_time: "17:00",
      return_arrival_time: "18:50",
      return_baggage: "20kg",
      price: 3000000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: haNoi.id,
      destination_id: daLat.id,
      departure_flight_number: "VJ401",
      departure_time: "10:00",
      departure_arrival_time: "11:50",
      departure_baggage: "7kg",
      return_flight_number: "VJ402",
      return_time: "19:00",
      return_arrival_time: "20:50",
      return_baggage: "7kg",
      price: 2200000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: haNoi.id,
      destination_id: daLat.id,
      departure_flight_number: "QH301",
      departure_time: "14:30",
      departure_arrival_time: "16:20",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH302",
      return_time: "21:00",
      return_arrival_time: "22:50",
      return_baggage: "30kg (Thương gia)",
      price: 3800000,
      is_recommended: false,
      price_difference: 800000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: daNang.id, // ID: 3
      destination_id: phuQuoc.id, // ID: 4
      departure_flight_number: "VN185",
      departure_time: "08:05",
      departure_arrival_time: "09:50",
      departure_baggage: "20kg",
      return_flight_number: "VN186",
      return_time: "17:30",
      return_arrival_time: "19:15",
      return_baggage: "20kg",
      price: 2900000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: daNang.id, // ID: 3
      destination_id: phuQuoc.id, // ID: 4
      departure_flight_number: "VJ635",
      departure_time: "06:20",
      departure_arrival_time: "08:05",
      departure_baggage: "7kg",
      return_flight_number: "VJ636",
      return_time: "18:00",
      return_arrival_time: "19:45",
      return_baggage: "7kg",
      price: 2100000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: daNang.id, // ID: 3
      destination_id: phuQuoc.id, // ID: 4
      departure_flight_number: "QH501",
      departure_time: "14:00",
      departure_arrival_time: "15:45",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH502",
      return_time: "20:30",
      return_arrival_time: "22:15",
      return_baggage: "30kg (Thương gia)",
      price: 3600000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Đà Nẵng -> Đà Lạt (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: daNang.id, // ID: 3
      destination_id: daLat.id, // ID: 5
      departure_flight_number: "VN195",
      departure_time: "07:00",
      departure_arrival_time: "08:15",
      departure_baggage: "20kg",
      return_flight_number: "VN196",
      return_time: "16:30",
      return_arrival_time: "17:45",
      return_baggage: "20kg",
      price: 2600000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: daNang.id, // ID: 3
      destination_id: daLat.id, // ID: 5
      departure_flight_number: "VJ701",
      departure_time: "09:00",
      departure_arrival_time: "10:15",
      departure_baggage: "7kg",
      return_flight_number: "VJ702",
      return_time: "18:00",
      return_arrival_time: "19:15",
      return_baggage: "7kg",
      price: 1900000,
      is_recommended: true,
      price_difference: -700000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: daNang.id, // ID: 3
      destination_id: daLat.id, // ID: 5
      departure_flight_number: "QH601",
      departure_time: "13:30",
      departure_arrival_time: "14:45",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH602",
      return_time: "20:00",
      return_arrival_time: "21:15",
      return_baggage: "30kg (Thương gia)",
      price: 3300000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });
    // Hồ Chí Minh -> Nha Trang (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: hoChiMinh.id, // ID: 2
      destination_id: nhaTrang.id, // ID: 6
      departure_flight_number: "VN134",
      departure_time: "07:00",
      departure_arrival_time: "08:10",
      departure_baggage: "20kg",
      return_flight_number: "VN135",
      return_time: "17:00",
      return_arrival_time: "18:10",
      return_baggage: "20kg",
      price: 2700000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: hoChiMinh.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "VJ770",
      departure_time: "09:30",
      departure_arrival_time: "10:40",
      departure_baggage: "7kg",
      return_flight_number: "VJ771",
      return_time: "19:00",
      return_arrival_time: "20:10",
      return_baggage: "7kg",
      price: 1900000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: hoChiMinh.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "QH301",
      departure_time: "14:00",
      departure_arrival_time: "15:10",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH302",
      return_time: "20:30",
      return_arrival_time: "21:40",
      return_baggage: "30kg (Thương gia)",
      price: 3400000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Hồ Chí Minh -> Hạ Long (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: hoChiMinh.id, // ID: 2
      destination_id: haLong.id, // ID: 7
      departure_flight_number: "VN260",
      departure_time: "08:00",
      departure_arrival_time: "10:10",
      departure_baggage: "20kg",
      return_flight_number: "VN261",
      return_time: "17:00",
      return_arrival_time: "19:10",
      return_baggage: "20kg",
      price: 3200000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: hoChiMinh.id,
      destination_id: haLong.id,
      departure_flight_number: "VJ272",
      departure_time: "10:00",
      departure_arrival_time: "12:10",
      departure_baggage: "7kg",
      return_flight_number: "VJ273",
      return_time: "19:00",
      return_arrival_time: "21:10",
      return_baggage: "7kg",
      price: 2400000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: hoChiMinh.id,
      destination_id: haLong.id,
      departure_flight_number: "QH401",
      departure_time: "14:30",
      departure_arrival_time: "16:40",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH402",
      return_time: "21:00",
      return_arrival_time: "23:10",
      return_baggage: "30kg (Thương gia)",
      price: 3900000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Hà Nội -> Nha Trang (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: haNoi.id, // ID: 1
      destination_id: nhaTrang.id, // ID: 6
      departure_flight_number: "VN155",
      departure_time: "07:30",
      departure_arrival_time: "09:20",
      departure_baggage: "20kg",
      return_flight_number: "VN156",
      return_time: "17:30",
      return_arrival_time: "19:20",
      return_baggage: "20kg",
      price: 3100000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: haNoi.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "VJ781",
      departure_time: "09:00",
      departure_arrival_time: "10:50",
      departure_baggage: "7kg",
      return_flight_number: "VJ782",
      return_time: "19:00",
      return_arrival_time: "20:50",
      return_baggage: "7kg",
      price: 2300000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: haNoi.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "QH501",
      departure_time: "14:00",
      departure_arrival_time: "15:50",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH502",
      return_time: "20:30",
      return_arrival_time: "22:20",
      return_baggage: "30kg (Thương gia)",
      price: 3800000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Hà Nội -> Hạ Long (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: haNoi.id, // ID: 1
      destination_id: haLong.id, // ID: 7
      departure_flight_number: "VN165",
      departure_time: "07:00",
      departure_arrival_time: "07:45",
      departure_baggage: "20kg",
      return_flight_number: "VN166",
      return_time: "16:00",
      return_arrival_time: "16:45",
      return_baggage: "20kg",
      price: 2000000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: haNoi.id,
      destination_id: haLong.id,
      departure_flight_number: "VJ791",
      departure_time: "09:00",
      departure_arrival_time: "09:45",
      departure_baggage: "7kg",
      return_flight_number: "VJ792",
      return_time: "18:00",
      return_arrival_time: "18:45",
      return_baggage: "7kg",
      price: 1400000,
      is_recommended: true,
      price_difference: -600000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: haNoi.id,
      destination_id: haLong.id,
      departure_flight_number: "QH601",
      departure_time: "13:00",
      departure_arrival_time: "13:45",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH602",
      return_time: "20:00",
      return_arrival_time: "20:45",
      return_baggage: "30kg (Thương gia)",
      price: 2700000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Đà Nẵng -> Nha Trang (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: daNang.id, // ID: 3
      destination_id: nhaTrang.id, // ID: 6
      departure_flight_number: "VN191",
      departure_time: "07:30",
      departure_arrival_time: "08:40",
      departure_baggage: "20kg",
      return_flight_number: "VN192",
      return_time: "17:00",
      return_arrival_time: "18:10",
      return_baggage: "20kg",
      price: 2600000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: daNang.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "VJ721",
      departure_time: "09:00",
      departure_arrival_time: "10:10",
      departure_baggage: "7kg",
      return_flight_number: "VJ722",
      return_time: "18:30",
      return_arrival_time: "19:40",
      return_baggage: "7kg",
      price: 1800000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: daNang.id,
      destination_id: nhaTrang.id,
      departure_flight_number: "QH701",
      departure_time: "14:00",
      departure_arrival_time: "15:10",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH702",
      return_time: "20:30",
      return_arrival_time: "21:40",
      return_baggage: "30kg (Thương gia)",
      price: 3300000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });

    // Đà Nẵng -> Hạ Long (bổ sung mới)
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: daNang.id, // ID: 3
      destination_id: haLong.id, // ID: 7
      departure_flight_number: "VN175",
      departure_time: "08:00",
      departure_arrival_time: "09:20",
      departure_baggage: "20kg",
      return_flight_number: "VN176",
      return_time: "17:00",
      return_arrival_time: "18:20",
      return_baggage: "20kg",
      price: 3000000,
      is_recommended: false,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: daNang.id,
      destination_id: haLong.id,
      departure_flight_number: "VJ731",
      departure_time: "10:00",
      departure_arrival_time: "11:20",
      departure_baggage: "7kg",
      return_flight_number: "VJ732",
      return_time: "19:00",
      return_arrival_time: "20:20",
      return_baggage: "7kg",
      price: 2200000,
      is_recommended: true,
      price_difference: -800000,
      features: ["Bay thẳng"]
    });
    await this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: daNang.id,
      destination_id: haLong.id,
      departure_flight_number: "QH801",
      departure_time: "14:30",
      departure_arrival_time: "15:50",
      departure_baggage: "30kg (Thương gia)",
      return_flight_number: "QH802",
      return_time: "21:00",
      return_arrival_time: "22:20",
      return_baggage: "30kg (Thương gia)",
      price: 3700000,
      is_recommended: false,
      price_difference: 700000,
      features: ["Bay thẳng", "Hạng thương gia"]
    });
























    console.log("Transportation options:", Array.from(this.transportationOptions.values()));

    // Accommodation Types
    const hotel = await this.createAccommodationType({ name: "Khách sạn" });
    const resort = await this.createAccommodationType({ name: "Resort" });
    console.log("Accommodation types:", Array.from(this.accommodationTypes.values()));

// Accommodations
await this.createAccommodation({
  name: "Vinpearl Resort & Spa",
  location_id: phuQuoc.id,
  address: "Bãi Dài, Phú Quốc",
  type_id: resort.id,
  rating: 5.0,
  checkin_time: "14:00",
  checkout_time: "12:00",
  price_per_night: 2000000,
  is_recommended: true,
  price_difference: 0,
  Breakfast: true,
  image_url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9",
  features: ["Bãi biển", "Hồ bơi", "Spa", "Phòng gia đình"],
  latitude: 10.3430,  // Vĩ độ của Bãi Dài, Phú Quốc
  longitude: 103.8568 // Kinh độ của Bãi Dài, Phú Quốc
});

await this.createAccommodation({
  name: "Novotel Phú Quốc Resort",
  location_id: phuQuoc.id,
  address: "Dương Đông, Phú Quốc",
  type_id: resort.id,
  rating: 4.7,
  checkin_time: "14:00",
  checkout_time: "12:00",
  Breakfast: true,
  price_per_night: 1625000,
  is_recommended: false,
  price_difference: -375000,
  image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  features: ["Bãi biển", "Hồ bơi", "Quầy bar"],
  latitude: 10.2150,  // Vĩ độ của Dương Đông, Phú Quốc
  longitude: 103.9590 // Kinh độ của Dương Đông, Phú Quốc
});

await this.createAccommodation({
  name: "Fusion Resort Phu Quoc",
  location_id: phuQuoc.id,
  address: "Vung Bau, Phú Quốc",
  type_id: resort.id,
  checkin_time: "14:00",
  checkout_time: "12:00",
  rating: 4.8,
  price_per_night: 4500000,
  Breakfast: true,
  is_recommended: false,
  price_difference: 2500000,
  image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  features: ["Bãi biển riêng", "Spa cao cấp", "Hồ bơi vô cực", "Nhà hàng 5 sao"],
  latitude: 10.3478,  // Vĩ độ của Vũng Bầu, Phú Quốc
  longitude: 103.8600 // Kinh độ của Vũng Bầu, Phú Quốc
});

await this.createAccommodation({
  name: "Nam Nghi Resort",
  location_id: phuQuoc.id,
  address: "Mong Tay, Phú Quốc",
  type_id: resort.id,
  checkin_time: "14:00",
  checkout_time: "12:00",
  rating: 4.5,
  price_per_night: 1500000,
  is_recommended: false,
  Breakfast: true,
  price_difference: -500000,
  image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  features: ["Bãi biển", "Hồ bơi", "Nhà hàng", "Bar"],
  latitude: 10.4068,  // Vĩ độ của Móng Tay, Phú Quốc
  longitude: 103.9305 // Kinh độ của Móng Tay, Phú Quốc
});

await this.createAccommodation({
  name: "Novotel Hạ Long Resort",
  location_id: haLong.id,
  address: "Bãi Cháy, Hạ Long",
  type_id: resort.id,
  rating: 4.7,
  checkin_time: "14:00",
  checkout_time: "12:00",
  price_per_night: 1625000,
  Breakfast: true,
  is_recommended: false,
  price_difference: -375000,
  image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  features: ["Bãi biển", "Hồ bơi", "Quầy bar"],
  latitude: 20.9518,  // Vĩ độ của Bãi Cháy, Hạ Long
  longitude: 107.0470 // Kinh độ của Bãi Cháy, Hạ Long
});

await this.createAccommodation({
  name: "Mercure Dalat",
  location_id: daLat.id,
  address: "Đà Lạt, Lâm Đồng",
  type_id: hotel.id,
  rating: 4.7,
  checkin_time: "14:00",
  checkout_time: "12:00",
  price_per_night: 1625000,
  is_recommended: false,
  Breakfast: true,
  price_difference: -375000,
  image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
  features: ["Hồ bơi", "Quầy bar"],
  latitude: 11.9416,  // Vĩ độ của trung tâm Đà Lạt
  longitude: 108.4383 // Kinh độ của trung tâm Đà Lạt
});

await this.createAccommodation({
  name: "Radisson Blu Cam Ranh",
  location_id: nhaTrang.id,
  address: "Cam Ranh, Khánh Hòa",
  type_id: resort.id,
  rating: 4.8,
  checkin_time: "14:00",
  checkout_time: "12:00",
  price_per_night: 2500000,
  is_recommended: false,
  Breakfast: true,
  price_difference: 1000000,
  image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
  features: ["Bãi biển riêng", "Spa cao cấp", "Hồ bơi vô cực", "Nhà hàng 5 sao"],
  latitude: 11.9127,  // Vĩ độ của Cam Ranh, Nha Trang
  longitude: 109.2208 // Kinh độ của Cam Ranh, Nha Trang
});

console.log("Accommodations:", Array.from(this.accommodations.values()));

    // Attractions
    await this.createAttraction({
      name: "Vinpearl Safari",
      location_id: phuQuoc.id,
      description: "Vườn thú bán hoang dã đầu tiên tại Việt Nam",
      price: 650000,
      duration: "3h",
      opentime: "10:00",
      closetime: "21:00",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Bãi Sao",
      location_id: phuQuoc.id,
      description: "Một trong những bãi biển đẹp nhất Phú Quốc",
      price: 50000,
      duration: "4h",
      opentime: "06:00",
      closetime: "18:00",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Cáp treo Hòn Thơm",
      location_id: phuQuoc.id,
      description: "Cáp treo vượt biển dài nhất thế giới",
      price: 500000,
      duration: "2h",
      opentime: "10:00",
      closetime: "21:00",
      image_url: "",
      is_recommended: false
    });

    // Nha Trang (giữ nguyên và bổ sung thêm)
    await this.createAttraction({
      name: "Vinwonders Nha Trang",
      location_id: nhaTrang.id, // ID: 6
      description: "Công viên giải trí ở Nha Trang",
      price: 750000,
      opentime: "10:00",
      closetime: "21:00",
      duration: "4h",
      image_url: "",
      is_recommended: false
    });

    await this.createAttraction({
      name: "Tháp Bà Ponagar",
      location_id: nhaTrang.id, // ID: 6
      description: "Di tích lịch sử Chăm Pa cổ kính",
      price: 22000,
      duration: "1h",
      opentime: "06:00",
      closetime: "16:00",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Đảo Hòn Mun",
      location_id: nhaTrang.id, // ID: 6
      description: "Khu vực lặn biển ngắm san hô nổi tiếng",
      price: 300000,
      duration: "3h",
      opentime: "10:00",
      closetime: "16:00",
      image_url: "",
      is_recommended: true
    });

    // Đà Lạt (bổ sung mới)
    await this.createAttraction({
      name: "Hồ Xuân Hương",
      location_id: daLat.id, // ID: 5
      description: "Hồ nước nổi tiếng giữa lòng thành phố Đà Lạt",
      price: 0,
      duration: "2h",
      opentime: "00:00",
      closetime: "23:59",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Thung Lũng Tình Yêu",
      location_id: daLat.id, // ID: 5
      description: "Địa điểm lãng mạn với cảnh quan thiên nhiên tuyệt đẹp",
      price: 250000,
      duration: "3h",
      opentime: "08:00",
      closetime: "18:00",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Cáp treo Đà Lạt",
      location_id: daLat.id, // ID: 5
      description: "Trải nghiệm cáp treo ngắm toàn cảnh Đà Lạt",
      price: 100000,
      duration: "1h",
      opentime: "08:00",
      closetime: "16:00",
      image_url: "",
      is_recommended: false
    });

    // Hạ Long (bổ sung mới)
    await this.createAttraction({
      name: "Vịnh Hạ Long",
      location_id: haLong.id, // ID: 7
      description: "Kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá",
      price: 290000,
      duration: "4h",
      opentime: "00:00",
      closetime: "23:59",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Hang Sửng Sốt",
      location_id: haLong.id, // ID: 7
      description: "Hang động lớn và đẹp nhất Vịnh Hạ Long",
      price: 50000,
      opentime: "10:00",
      closetime: "16:00",
      duration: "1h",
      image_url: "",
      is_recommended: true
    });

    await this.createAttraction({
      name: "Cáp treo Nữ Hoàng",
      location_id: haLong.id, // ID: 7
      description: "Cáp treo ngắm toàn cảnh Vịnh Hạ Long từ trên cao",
      price: 350000,
      duration: "2h",
      opentime: "08:00",
      closetime: "21:00",
      image_url: "",
      is_recommended: false
    });


















    console.log("Attractions:", Array.from(this.attractions.values()));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Location methods
  async getLocations(type?: string): Promise<Location[]> {
    const locations = Array.from(this.locations.values());
    return type ? locations.filter(loc => loc.type === type) : locations;
  }

  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = this.locationCurrentId++;
    const newLocation = { ...location, id };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  // Transportation methods
  async getTransportationTypes(): Promise<TransportationType[]> {
    return Array.from(this.transportationTypes.values());
  }

  async getTransportationOptions(originId: number, destinationId: number): Promise<TransportationOption[]> {
    return Array.from(this.transportationOptions.values())
      .filter(option => option.origin_id === originId && option.destination_id === destinationId);
  }

  async getTransportationOption(id: number): Promise<TransportationOption | undefined> {
    return this.transportationOptions.get(id);
  }

  async createTransportationType(type: InsertTransportationType): Promise<TransportationType> {
    const id = this.transportationTypeCurrentId++;
    const newType = { ...type, id };
    this.transportationTypes.set(id, newType);
    return newType;
  }

  async createTransportationOption(option: InsertTransportationOption): Promise<TransportationOption> {
    const id = this.transportationOptionCurrentId++;
    const newOption = { ...option, id };
    this.transportationOptions.set(id, newOption);
    return newOption;
  }

  // Accommodation methods
  async getAccommodationTypes(): Promise<AccommodationType[]> {
    return Array.from(this.accommodationTypes.values());
  }

  async getAccommodations(locationId: number): Promise<Accommodation[]> {
    return Array.from(this.accommodations.values())
      .filter(accom => accom.location_id === locationId);
  }

  async getAccommodation(id: number): Promise<Accommodation | undefined> {
    return this.accommodations.get(id);
  }

  async createAccommodationType(type: InsertAccommodationType): Promise<AccommodationType> {
    const id = this.accommodationTypeCurrentId++;
    const newType = { ...type, id };
    this.accommodationTypes.set(id, newType);
    return newType;
  }

  async createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation> {
    const id = this.accommodationCurrentId++;
    const newAccommodation = { ...accommodation, id };
    this.accommodations.set(id, newAccommodation);
    return newAccommodation;
  }

  // Attraction methods
  async getAttractions(locationId: number): Promise<Attraction[]> {
    return Array.from(this.attractions.values())
      .filter(attr => attr.location_id === locationId);
  }

  async getAttraction(id: number): Promise<Attraction | undefined> {
    return this.attractions.get(id);
  }

  async createAttraction(attraction: InsertAttraction): Promise<Attraction> {
    const id = this.attractionCurrentId++;
    const newAttraction = { ...attraction, id };
    this.attractions.set(id, newAttraction);
    return newAttraction;
  }

  // Trip methods
  async getTrips(userId?: number): Promise<Trip[]> {
    const trips = Array.from(this.trips.values());
    return userId ? trips.filter(trip => trip.user_id === userId) : trips;
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    const id = this.tripCurrentId++;
    const newTrip = { ...trip, id, created_at: new Date() };
    this.trips.set(id, newTrip);
    return newTrip;
  }

  async updateTrip(id: number, tripUpdate: Partial<InsertTrip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    const updatedTrip = { ...trip, ...tripUpdate };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  // Trip Accommodation methods
  async getTripAccommodations(tripId: number): Promise<TripAccommodation[]> {
    return Array.from(this.tripAccommodations.values())
      .filter(accom => accom.trip_id === tripId);
  }

  async addTripAccommodation(tripAccommodation: InsertTripAccommodation): Promise<TripAccommodation> {
    const id = this.tripAccommodationCurrentId++;
    const newTripAccommodation = { ...tripAccommodation, id };
    this.tripAccommodations.set(id, newTripAccommodation);
    return newTripAccommodation;
  }

  async removeTripAccommodation(id: number): Promise<boolean> {
    return this.tripAccommodations.delete(id);
  }

  // Trip Transportation methods
  async getTripTransportations(tripId: number): Promise<TripTransportation[]> {
    return Array.from(this.tripTransportations.values())
      .filter(trans => trans.trip_id === tripId);
  }

  async addTripTransportation(tripTransportation: InsertTripTransportation): Promise<TripTransportation> {
    const id = this.tripTransportationCurrentId++;
    const newTripTransportation = { ...tripTransportation, id };
    this.tripTransportations.set(id, newTripTransportation);
    return newTripTransportation;
  }

  async updateTripTransportation(id: number, update: Partial<InsertTripTransportation>): Promise<TripTransportation | undefined> {
    const transportation = this.tripTransportations.get(id);
    if (!transportation) return undefined;
    const updatedTransportation = { ...transportation, ...update };
    this.tripTransportations.set(id, updatedTransportation);
    return updatedTransportation;
  }

  // Trip Attraction methods
  async getTripAttractions(tripId: number): Promise<TripAttraction[]> {
    return Array.from(this.tripAttractions.values())
      .filter(attr => attr.trip_id === tripId);
  }

  async addTripAttraction(tripAttraction: InsertTripAttraction): Promise<TripAttraction> {
    const id = this.tripAttractionCurrentId++;
    const newTripAttraction = { ...tripAttraction, id };
    this.tripAttractions.set(id, newTripAttraction);
    return newTripAttraction;
  }

  async removeTripAttraction(id: number): Promise<boolean> {
    return this.tripAttractions.delete(id);
  }
}

export const storage = new MemStorage();