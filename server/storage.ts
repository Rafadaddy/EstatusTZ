import { busUnits, type BusUnit, type InsertBusUnit } from "@shared/schema";

export interface IStorage {
  getBusUnit(id: number): Promise<BusUnit | undefined>;
  getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined>;
  getAllBusUnits(): Promise<BusUnit[]>;
  createBusUnit(unit: InsertBusUnit): Promise<BusUnit>;
  updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined>;
  deleteBusUnit(id: number): Promise<boolean>;
  deleteAllBusUnits(): Promise<void>;
}

export class MemStorage implements IStorage {
  private busUnits: Map<number, BusUnit>;
  private currentId: number;

  constructor() {
    this.busUnits = new Map();
    this.currentId = 1;
  }

  async getBusUnit(id: number): Promise<BusUnit | undefined> {
    return this.busUnits.get(id);
  }

  async getBusUnitByNumber(unitNumber: number): Promise<BusUnit | undefined> {
    return Array.from(this.busUnits.values()).find(
      (unit) => unit.unitNumber === unitNumber,
    );
  }

  async getAllBusUnits(): Promise<BusUnit[]> {
    return Array.from(this.busUnits.values()).sort((a, b) => a.unitNumber - b.unitNumber);
  }

  async createBusUnit(insertUnit: InsertBusUnit): Promise<BusUnit> {
    const id = this.currentId++;
    const unit: BusUnit = { ...insertUnit, id };
    this.busUnits.set(id, unit);
    return unit;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    const existingUnit = this.busUnits.get(id);
    if (!existingUnit) return undefined;

    const updatedUnit: BusUnit = { ...existingUnit, ...updates };
    this.busUnits.set(id, updatedUnit);
    return updatedUnit;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    return this.busUnits.delete(id);
  }

  async deleteAllBusUnits(): Promise<void> {
    this.busUnits.clear();
  }
}

export const storage = new MemStorage();
