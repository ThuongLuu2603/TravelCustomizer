import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertTripSchema,
  insertTripAccommodationSchema, 
  insertTripTransportationSchema,
  insertTripAttractionSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Error handling middleware
  const handleErrors = (err: any, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: err.message || "Server error" });
  };

  // Get all locations
  apiRouter.get("/locations", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const locations = await storage.getLocations(type);
      res.json(locations);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get location by ID
  apiRouter.get("/locations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocation(id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get transportation types
  apiRouter.get("/transportation-types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getTransportationTypes();
      res.json(types);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get transportation options
  apiRouter.get("/transportation-options", async (req: Request, res: Response) => {
    try {
      const { originId, destinationId } = req.query;
      if (!originId || !destinationId) {
        return res.status(400).json({ message: "Origin and destination IDs are required" });
      }

      const options = await storage.getTransportationOptions(
        parseInt(originId as string),
        parseInt(destinationId as string)
      );
      res.json(options);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get accommodation types
  apiRouter.get("/accommodation-types", async (_req: Request, res: Response) => {
    try {
      const types = await storage.getAccommodationTypes();
      res.json(types);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get accommodations by location
  apiRouter.get("/accommodations", async (req: Request, res: Response) => {
    try {
      const { locationId } = req.query;
      if (!locationId) {
        return res.status(400).json({ message: "Location ID is required" });
      }

      const accommodations = await storage.getAccommodations(parseInt(locationId as string));
      res.json(accommodations);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get attractions by location
  apiRouter.get("/attractions", async (req: Request, res: Response) => {
    try {
      const { locationId } = req.query;
      if (!locationId) {
        return res.status(400).json({ message: "Location ID is required" });
      }

      const attractions = await storage.getAttractions(parseInt(locationId as string));
      res.json(attractions);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Create a trip
  apiRouter.post("/trips", async (req: Request, res: Response) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(tripData);
      res.status(201).json(trip);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get a trip by ID
  apiRouter.get("/trips/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const trip = await storage.getTrip(id);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(trip);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Update a trip
  apiRouter.patch("/trips/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tripUpdateData = insertTripSchema.partial().parse(req.body);
      const updatedTrip = await storage.updateTrip(id, tripUpdateData);
      if (!updatedTrip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.json(updatedTrip);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Add accommodation to trip
  apiRouter.post("/trips/:tripId/accommodations", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const accommodationData = insertTripAccommodationSchema.parse({
        ...req.body,
        trip_id: tripId
      });

      const tripAccommodation = await storage.addTripAccommodation(accommodationData);
      res.status(201).json(tripAccommodation);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get trip accommodations
  apiRouter.get("/trips/:tripId/accommodations", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const accommodations = await storage.getTripAccommodations(tripId);
      res.json(accommodations);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Remove accommodation from trip
  apiRouter.delete("/trips/:tripId/accommodations/:id", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const accommodationId = parseInt(req.params.id);

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const success = await storage.removeTripAccommodation(accommodationId);
      if (!success) {
        return res.status(404).json({ message: "Trip accommodation not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Add transportation to trip
  apiRouter.post("/trips/:tripId/transportations", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const transportationData = insertTripTransportationSchema.parse({
        ...req.body,
        trip_id: tripId
      });

      const tripTransportation = await storage.addTripTransportation(transportationData);
      res.status(201).json(tripTransportation);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get trip transportations
  apiRouter.get("/trips/:tripId/transportations", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const transportations = await storage.getTripTransportations(tripId);
      res.json(transportations);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Add attraction to trip
  apiRouter.post("/trips/:tripId/attractions", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const attractionData = insertTripAttractionSchema.parse({
        ...req.body,
        trip_id: tripId
      });

      const tripAttraction = await storage.addTripAttraction(attractionData);
      res.status(201).json(tripAttraction);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Get trip attractions
  apiRouter.get("/trips/:tripId/attractions", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const attractions = await storage.getTripAttractions(tripId);
      res.json(attractions);
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Remove attraction from trip
  apiRouter.delete("/trips/:tripId/attractions/:id", async (req: Request, res: Response) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const attractionId = parseInt(req.params.id);

      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const success = await storage.removeTripAttraction(attractionId);
      if (!success) {
        return res.status(404).json({ message: "Trip attraction not found" });
      }

      res.status(204).end();
    } catch (err) {
      handleErrors(err, res);
    }
  });

  // Mount the API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}