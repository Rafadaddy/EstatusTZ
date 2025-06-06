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
  private dataFile: string;

  constructor() {
    this.dataFile = './data/busUnits.json';
    this.busUnits = new Map();
    this.currentId = 1;
    this.loadFromFile();
  }

  private async loadFromFile(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.dataFile);
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Try to read existing data
      try {
        const data = await fs.readFile(this.dataFile, 'utf-8');
        const parsed = JSON.parse(data);
        
        if (parsed.units && Array.isArray(parsed.units)) {
          this.busUnits.clear();
          parsed.units.forEach((unit: BusUnit) => {
            this.busUnits.set(unit.id, unit);
          });
          this.currentId = Math.max(...parsed.units.map((u: BusUnit) => u.id), 0) + 1;
        }
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        await this.saveToFile();
      }
    } catch (error) {
      console.log('Storage initialization error:', error);
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const data = {
        units: Array.from(this.busUnits.values()),
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving to file:', error);
    }
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
    const unit: BusUnit = { 
      id,
      unitNumber: insertUnit.unitNumber,
      MOT: insertUnit.MOT || "listo",
      TRAN: insertUnit.TRAN || "listo",
      ELE: insertUnit.ELE || "listo",
      AA: insertUnit.AA || "listo",
      FRE: insertUnit.FRE || "listo",
      SUS: insertUnit.SUS || "listo",
      DIR: insertUnit.DIR || "listo",
      HOJ: insertUnit.HOJ || "listo",
      TEL: insertUnit.TEL || "listo"
    };
    this.busUnits.set(id, unit);
    await this.saveToFile();
    return unit;
  }

  async updateBusUnit(id: number, updates: Partial<InsertBusUnit>): Promise<BusUnit | undefined> {
    const existingUnit = this.busUnits.get(id);
    if (!existingUnit) return undefined;

    const updatedUnit: BusUnit = { ...existingUnit, ...updates };
    this.busUnits.set(id, updatedUnit);
    await this.saveToFile();
    return updatedUnit;
  }

  async deleteBusUnit(id: number): Promise<boolean> {
    const deleted = this.busUnits.delete(id);
    if (deleted) {
      await this.saveToFile();
    }
    return deleted;
  }

  async deleteAllBusUnits(): Promise<void> {
    this.busUnits.clear();
    await this.saveToFile();
  }
}

export const storage = new MemStorage();
