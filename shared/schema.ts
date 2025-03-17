import { pgTable, text, serial, integer, boolean, date, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from existing file - keeping it for reference
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'origin', 'destination'
  description: text("description"),
  image_url: text("image_url"),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Transportation Types
export const transportationTypes = pgTable("transportation_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
});

export const insertTransportationTypeSchema = createInsertSchema(transportationTypes).omit({
  id: true,
});

export type InsertTransportationType = z.infer<typeof insertTransportationTypeSchema>;
export type TransportationType = typeof transportationTypes.$inferSelect;

// Transportation Options
export const transportationOptions = pgTable("transportation_options", {
  id: serial("id").primaryKey(),
  type_id: integer("type_id").notNull(), // Reference to transportationTypes
  provider: text("provider").notNull(),
  origin_id: integer("origin_id").notNull(), // Reference to locations
  destination_id: integer("destination_id").notNull(), // Reference to locations
  departure_time: text("departure_time").notNull(),
  arrival_time: text("arrival_time").notNull(),
  duration: text("duration").notNull(),
  price: numeric("price").notNull(),
  is_recommended: boolean("is_recommended").default(false),
  price_difference: numeric("price_difference").default(0),
  features: text("features").array(),
});

export const insertTransportationOptionSchema = createInsertSchema(transportationOptions).omit({
  id: true,
});

export type InsertTransportationOption = z.infer<typeof insertTransportationOptionSchema>;
export type TransportationOption = typeof transportationOptions.$inferSelect;

// Accommodation Types
export const accommodationTypes = pgTable("accommodation_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertAccommodationTypeSchema = createInsertSchema(accommodationTypes).omit({
  id: true,
});

export type InsertAccommodationType = z.infer<typeof insertAccommodationTypeSchema>;
export type AccommodationType = typeof accommodationTypes.$inferSelect;

// Accommodations
export const accommodations = pgTable("accommodations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location_id: integer("location_id").notNull(), // Reference to locations
  address: text("address").notNull(),
  type_id: integer("type_id").notNull(), // Reference to accommodationTypes
  rating: numeric("rating"),
  price_per_night: numeric("price_per_night").notNull(),
  is_recommended: boolean("is_recommended").default(false),
  price_difference: numeric("price_difference").default(0),
  image_url: text("image_url"),
  features: text("features").array(),
});

export const insertAccommodationSchema = createInsertSchema(accommodations).omit({
  id: true,
});

export type InsertAccommodation = z.infer<typeof insertAccommodationSchema>;
export type Accommodation = typeof accommodations.$inferSelect;

// Attractions
export const attractions = pgTable("attractions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location_id: integer("location_id").notNull(), // Reference to locations
  description: text("description").notNull(),
  price: numeric("price"),
  duration: text("duration").notNull(),
  image_url: text("image_url"),
  is_recommended: boolean("is_recommended").default(false),
});

export const insertAttractionSchema = createInsertSchema(attractions).omit({
  id: true,
});

export type InsertAttraction = z.infer<typeof insertAttractionSchema>;
export type Attraction = typeof attractions.$inferSelect;

// Trip Schema
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  origin_id: integer("origin_id").notNull(), // Reference to locations
  destination_id: integer("destination_id").notNull(), // Reference to locations
  transportation_type_id: integer("transportation_type_id"), // Reference to transportationTypes
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").notNull(),
  total_price: numeric("total_price"),
  status: text("status").default("draft"), // 'draft', 'confirmed', 'completed', 'cancelled'
  created_at: timestamp("created_at").defaultNow(),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  created_at: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

// Trip Accommodations
export const tripAccommodations = pgTable("trip_accommodations", {
  id: serial("id").primaryKey(),
  trip_id: integer("trip_id").notNull(), // Reference to trips
  accommodation_id: integer("accommodation_id").notNull(), // Reference to accommodations
  location: text("location").notNull(),
  check_in_date: date("check_in_date").notNull(),
  check_out_date: date("check_out_date").notNull(),
});

export const insertTripAccommodationSchema = createInsertSchema(tripAccommodations).omit({
  id: true,
});

export type InsertTripAccommodation = z.infer<typeof insertTripAccommodationSchema>;
export type TripAccommodation = typeof tripAccommodations.$inferSelect;

// Trip Selected Transportation
export const tripTransportations = pgTable("trip_transportations", {
  id: serial("id").primaryKey(),
  trip_id: integer("trip_id").notNull(), // Reference to trips
  transportation_option_id: integer("transportation_option_id").notNull(), // Reference to transportationOptions
});

export const insertTripTransportationSchema = createInsertSchema(tripTransportations).omit({
  id: true,
});

export type InsertTripTransportation = z.infer<typeof insertTripTransportationSchema>;
export type TripTransportation = typeof tripTransportations.$inferSelect;

// Trip Selected Attractions
export const tripAttractions = pgTable("trip_attractions", {
  id: serial("id").primaryKey(),
  trip_id: integer("trip_id").notNull(), // Reference to trips
  attraction_id: integer("attraction_id").notNull(), // Reference to attractions
  day: integer("day").notNull(), // Which day of the trip
  time_slot: text("time_slot"), // e.g. 'morning', 'afternoon', 'evening'
});

export const insertTripAttractionSchema = createInsertSchema(tripAttractions).omit({
  id: true,
});

export type InsertTripAttraction = z.infer<typeof insertTripAttractionSchema>;
export type TripAttraction = typeof tripAttractions.$inferSelect;
