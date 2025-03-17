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
  // User methods from existing storage
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Location methods
  getLocations(type?: string): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Transportation methods
  getTransportationTypes(): Promise<TransportationType[]>;
  getTransportationOptions(originId: number, destinationId: number): Promise<TransportationOption[]>;
  getTransportationOption(id: number): Promise<TransportationOption | undefined>;
  createTransportationOption(option: InsertTransportationOption): Promise<TransportationOption>;

  // Accommodation methods
  getAccommodationTypes(): Promise<AccommodationType[]>;
  getAccommodations(locationId: number): Promise<Accommodation[]>;
  getAccommodation(id: number): Promise<Accommodation | undefined>;
  createAccommodation(accommodation: InsertAccommodation): Promise<Accommodation>;

  // Attraction methods
  getAttractions(locationId: number): Promise<Attraction[]>;
  getAttraction(id: number): Promise<Attraction | undefined>;
  createAttraction(attraction: InsertAttraction): Promise<Attraction>;

  // Trip methods
  getTrips(userId?: number): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;

  // Trip Accommodation methods
  getTripAccommodations(tripId: number): Promise<TripAccommodation[]>;
  addTripAccommodation(tripAccommodation: InsertTripAccommodation): Promise<TripAccommodation>;
  removeTripAccommodation(id: number): Promise<boolean>;

  // Trip Transportation methods
  getTripTransportations(tripId: number): Promise<TripTransportation[]>;
  addTripTransportation(tripTransportation: InsertTripTransportation): Promise<TripTransportation>;
  updateTripTransportation(id: number, tripTransportation: Partial<InsertTripTransportation>): Promise<TripTransportation | undefined>;

  // Trip Attraction methods
  getTripAttractions(tripId: number): Promise<TripAttraction[]>;
  addTripAttraction(tripAttraction: InsertTripAttraction): Promise<TripAttraction>;
  removeTripAttraction(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private locations: Map<number, Location>;
  private transportationTypes: Map<number, TransportationType>;
  private transportationOptions: Map<number, TransportationOption>;
  private accommodationTypes: Map<number, AccommodationType>;
  private accommodations: Map<number, Accommodation>;
  private attractions: Map<number, Attraction>;
  private trips: Map<number, Trip>;
  private tripAccommodations: Map<number, TripAccommodation>;
  private tripTransportations: Map<number, TripTransportation>;
  private tripAttractions: Map<number, TripAttraction>;

  private userCurrentId: number;
  private locationCurrentId: number;
  private transportationTypeCurrentId: number;
  private transportationOptionCurrentId: number;
  private accommodationTypeCurrentId: number;
  private accommodationCurrentId: number;
  private attractionCurrentId: number;
  private tripCurrentId: number;
  private tripAccommodationCurrentId: number;
  private tripTransportationCurrentId: number;
  private tripAttractionCurrentId: number;

  constructor() {
    this.users = new Map();
    this.locations = new Map();
    this.transportationTypes = new Map();
    this.transportationOptions = new Map();
    this.accommodationTypes = new Map();
    this.accommodations = new Map();
    this.attractions = new Map();
    this.trips = new Map();
    this.tripAccommodations = new Map();
    this.tripTransportations = new Map();
    this.tripAttractions = new Map();

    this.userCurrentId = 1;
    this.locationCurrentId = 1;
    this.transportationTypeCurrentId = 1;
    this.transportationOptionCurrentId = 1;
    this.accommodationTypeCurrentId = 1;
    this.accommodationCurrentId = 1;
    this.attractionCurrentId = 1;
    this.tripCurrentId = 1;
    this.tripAccommodationCurrentId = 1;
    this.tripTransportationCurrentId = 1;
    this.tripAttractionCurrentId = 1;

    // Initialize with some demo data
    this.initializeData();
  }

  private initializeData() {
    // Add sample locations
    const haNoi = this.createLocation({ 
      name: "Hà Nội", 
      type: "origin", 
      description: "Thủ đô của Việt Nam",
      image_url: ""
    });
    
    const hoChiMinh = this.createLocation({ 
      name: "Hồ Chí Minh", 
      type: "origin", 
      description: "Thành phố lớn nhất Việt Nam",
      image_url: ""
    });
    
    const daNang = this.createLocation({ 
      name: "Đà Nẵng", 
      type: "origin", 
      description: "Thành phố biển miền Trung",
      image_url: ""
    });
    
    const phuQuoc = this.createLocation({ 
      name: "Phú Quốc", 
      type: "destination", 
      description: "Đảo ngọc của Việt Nam",
      image_url: ""
    });
    
    const daLat = this.createLocation({ 
      name: "Đà Lạt", 
      type: "destination", 
      description: "Thành phố mộng mơ",
      image_url: ""
    });
    
    const nhaTrang = this.createLocation({ 
      name: "Nha Trang", 
      type: "destination", 
      description: "Thành phố biển nổi tiếng",
      image_url: ""
    });
    
    const haLong = this.createLocation({ 
      name: "Hạ Long", 
      type: "destination", 
      description: "Vịnh Hạ Long kỳ quan thiên nhiên",
      image_url: ""
    });

    // Add transportation types
    const plane = this.createTransportationType({ name: "Máy bay", icon: "bxs-plane" });
    const train = this.createTransportationType({ name: "Tàu hỏa", icon: "bxs-train" });
    const bus = this.createTransportationType({ name: "Xe khách", icon: "bxs-bus" });
    const car = this.createTransportationType({ name: "Xe riêng", icon: "bxs-car" });

    // Add transportation options
    this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietnam Airlines",
      origin_id: haNoi.id,
      destination_id: phuQuoc.id,
      departure_time: "08:00",
      arrival_time: "10:15",
      duration: "2h 15m",
      price: 2500000,
      is_recommended: true,
      price_difference: 0,
      features: ["Bay thẳng", "Hành lý 20kg"]
    });

    this.createTransportationOption({
      type_id: plane.id,
      provider: "Vietjet Air",
      origin_id: haNoi.id,
      destination_id: phuQuoc.id,
      departure_time: "12:30",
      arrival_time: "14:40",
      duration: "2h 10m",
      price: 2000000,
      is_recommended: false,
      price_difference: -500000,
      features: ["Bay thẳng", "Hành lý 7kg"]
    });

    this.createTransportationOption({
      type_id: plane.id,
      provider: "Bamboo Airways",
      origin_id: haNoi.id,
      destination_id: phuQuoc.id,
      departure_time: "15:45",
      arrival_time: "18:05",
      duration: "2h 20m",
      price: 3700000,
      is_recommended: false,
      price_difference: 1200000,
      features: ["Bay thẳng", "Hạng thương gia", "Hành lý 30kg"]
    });

    // Add accommodation types (destinations)
    const hanoi = this.createAccommodationType({ name: "Hà Nội" });
    const hochiminh = this.createAccommodationType({ name: "Hồ Chí Minh" });
    const phuquoc = this.createAccommodationType({ name: "Phú Quốc" });
    const danang = this.createAccommodationType({ name: "Đà Nẵng" });
    const dalat = this.createAccommodationType({ name: "Đà Lạt" });
    const nhatrang = this.createAccommodationType({ name: "Nha Trang" });
    const halong = this.createAccommodationType({ name: "Hạ Long" });

    // Add accommodations
    this.createAccommodation({
      name: "Vinpearl Resort & Spa",
      location_id: phuQuoc.id,
      address: "Bãi Dài, Phú Quốc",
      type_id: phuquoc.id,
      rating: 5.0,
      price_per_night: 2000000,
      is_recommended: true,
      price_difference: 0,
      image_url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
      features: ["Bãi biển", "Hồ bơi", "Spa", "Phòng gia đình"]
    });

    this.createAccommodation({
      name: "Novotel Phú Quốc Resort",
      location_id: phuQuoc.id,
      address: "Dương Đông, Phú Quốc",
      type_id: phuquoc.id,
      rating: 4.7,
      price_per_night: 1625000,
      is_recommended: false,
      price_difference: -1500000,
      image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400",
      features: ["Bãi biển", "Hồ bơi", "Quầy bar"]
    });

    // Add attractions
    this.createAttraction({
      name: "Vinpearl Safari",
      location_id: phuQuoc.id,
      description: "Vườn thú bán hoang dã đầu tiên tại Việt Nam",
      price: 650000,
      duration: "3h",
      image_url: "",
      is_recommended: true
    });

    this.createAttraction({
      name: "Bãi Sao",
      location_id: phuQuoc.id,
      description: "Một trong những bãi biển đẹp nhất Phú Quốc",
      price: 50000,
      duration: "4h",
      image_url: "",
      is_recommended: true
    });

    this.createAttraction({
      name: "Cáp treo Hòn Thơm",
      location_id: phuQuoc.id,
      description: "Cáp treo vượt biển dài nhất thế giới",
      price: 500000,
      duration: "2h",
      image_url: "",
      is_recommended: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
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
