import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusUnitSchema, ComponentStatus } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all bus units
  app.get("/api/units", async (req, res) => {
    try {
      const units = await storage.getAllBusUnits();
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Error fetching units" });
    }
  });

  // Create a new bus unit
  app.post("/api/units", async (req, res) => {
    try {
      const validatedData = insertBusUnitSchema.parse(req.body);
      
      // Check if unit number already exists
      const existingUnit = await storage.getBusUnitByNumber(validatedData.unitNumber);
      if (existingUnit) {
        return res.status(400).json({ message: "Ya existe una unidad con este número" });
      }

      const newUnit = await storage.createBusUnit(validatedData);
      res.status(201).json(newUnit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating unit" });
    }
  });

  // Update component status
  app.patch("/api/units/:id/component/:component", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const component = req.params.component;
      const { status } = req.body;

      // Validate component name and status
      const validComponents = ["MOT", "TRAN", "ELE", "AA", "FRE", "SUS", "DIR", "HOJ", "TEL"];
      if (!validComponents.includes(component)) {
        return res.status(400).json({ message: "Componente inválido" });
      }

      const validatedStatus = ComponentStatus.parse(status);
      
      const updates: any = {};
      updates[component] = validatedStatus;

      const updatedUnit = await storage.updateBusUnit(id, updates);
      if (!updatedUnit) {
        return res.status(404).json({ message: "Unidad no encontrada" });
      }

      res.json(updatedUnit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Estado inválido" });
      }
      res.status(500).json({ message: "Error updating unit" });
    }
  });

  // Delete a bus unit
  app.delete("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBusUnit(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Unidad no encontrada" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting unit" });
    }
  });

  // Delete all bus units
  app.delete("/api/units", async (req, res) => {
    try {
      await storage.deleteAllBusUnits();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting all units" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
