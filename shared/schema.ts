import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const busUnits = pgTable("bus_units", {
  id: serial("id").primaryKey(),
  unitNumber: integer("unit_number").notNull().unique(),
  MOT: text("mot").notNull().default("listo"),
  TRAN: text("tran").notNull().default("listo"),
  ELE: text("ele").notNull().default("listo"),
  AA: text("aa").notNull().default("listo"), // A/A field
  FRE: text("fre").notNull().default("listo"),
  SUS: text("sus").notNull().default("listo"),
  DIR: text("dir").notNull().default("listo"),
  HOJ: text("hoj").notNull().default("listo"),
  TEL: text("tel").notNull().default("listo"),
});

export const insertBusUnitSchema = createInsertSchema(busUnits).omit({
  id: true,
});

export type InsertBusUnit = z.infer<typeof insertBusUnitSchema>;
export type BusUnit = typeof busUnits.$inferSelect;

// Component status type
export const ComponentStatus = z.enum(["listo", "taller"]);
export type ComponentStatusType = z.infer<typeof ComponentStatus>;

// Component names
export const ComponentNames = [
  "MOT", "TRAN", "ELE", "AA", "FRE", "SUS", "DIR", "HOJ", "TEL"
] as const;
