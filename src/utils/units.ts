/**
 * Units of measure, and converting between them.
 *
 * Every unit is one number: how many base units it is worth. The base is per
 * quantity (metres, kilograms, litres, ...), never shown to the user - it only
 * exists so any two units of the same quantity can be converted through it.
 *
 * Temperature is deliberately absent: it converts through an offset as well as
 * a factor, which would need its own arithmetic and reads badly inside a sum.
 *
 * Pure - no Obsidian - so the table and the conversions are testable directly.
 */

/** What is being measured. The base unit of each is the first one listed. */
export type Quantity = "length" | "mass" | "volume" | "area" | "pressure" | "energy" | "power" | "time" | "speed";

/** Which family a unit belongs to, for grouping the picker. */
export type System = "metric" | "imperial" | "us" | "other";

export interface UnitDef {
  id: string;
  /** How it is written in the picker. */
  label: string;
  quantity: Quantity;
  system: System;
  /** How many base units one of these is worth. */
  factor: number;
  /** What may be typed for it, longest matched first. */
  aliases: string[];
}

const U = (
  id: string,
  label: string,
  quantity: Quantity,
  system: System,
  factor: number,
  aliases: string[]
): UnitDef => ({ id, label, quantity, system, factor, aliases });

/**
 * The table. Factors are exact where the definition is exact (an inch is
 * 25.4 mm by definition, a pound is 0.45359237 kg) and rounded only where the
 * unit itself is a rounded thing.
 */
export const UNITS: UnitDef[] = [
  // -- length (base: metre) --------------------------------------------------
  U("m", "Metre (m)", "length", "metric", 1, ["m", "meter", "meters", "metre", "metres"]),
  U("mm", "Millimetre (mm)", "length", "metric", 0.001, ["mm", "millimetre", "millimetres", "millimeter", "millimeters"]),
  U("cm", "Centimetre (cm)", "length", "metric", 0.01, ["cm", "centimetre", "centimetres", "centimeter", "centimeters"]),
  U("km", "Kilometre (km)", "length", "metric", 1000, ["km", "kilometre", "kilometres", "kilometer", "kilometers"]),
  U("in", 'Inch (in, ")', "length", "imperial", 0.0254, ["in", "inch", "inches", '"', "″"]),
  U("ft", "Foot (ft, ')", "length", "imperial", 0.3048, ["ft", "foot", "feet", "'", "′"]),
  U("yd", "Yard (yd)", "length", "imperial", 0.9144, ["yd", "yard", "yards"]),
  U("mi", "Mile (mi)", "length", "imperial", 1609.344, ["mi", "mile", "miles"]),
  U("nmi", "Nautical mile (nmi)", "length", "other", 1852, ["nmi", "nauticalmile", "nauticalmiles"]),

  // -- mass (base: kilogram) -------------------------------------------------
  U("kg", "Kilogram (kg)", "mass", "metric", 1, ["kg", "kilo", "kilos", "kilogram", "kilograms"]),
  U("mg", "Milligram (mg)", "mass", "metric", 1e-6, ["mg", "milligram", "milligrams"]),
  U("g", "Gram (g)", "mass", "metric", 0.001, ["g", "gram", "grams"]),
  U("t", "Tonne (t)", "mass", "metric", 1000, ["t", "tonne", "tonnes"]),
  U("oz", "Ounce (oz)", "mass", "imperial", 0.028349523125, ["oz", "ounce", "ounces"]),
  U("lb", "Pound (lb)", "mass", "imperial", 0.45359237, ["lb", "lbs", "pound", "pounds", "#"]),
  U("st", "Stone (st)", "mass", "imperial", 6.35029318, ["st", "stone", "stones"]),
  U("ton", "Short ton", "mass", "us", 907.18474, ["ton", "tons", "shortton"]),

  // -- volume (base: litre) --------------------------------------------------
  U("l", "Litre (L)", "volume", "metric", 1, ["l", "litre", "litres", "liter", "liters"]),
  U("ml", "Millilitre (mL)", "volume", "metric", 0.001, ["ml", "millilitre", "millilitres", "milliliter", "milliliters"]),
  U("m3", "Cubic metre (m3)", "volume", "metric", 1000, ["m3", "m^3", "cubicmetre", "cubicmeter"]),
  U("tsp", "Teaspoon (tsp)", "volume", "us", 0.00492892159375, ["tsp", "teaspoon", "teaspoons"]),
  U("tbsp", "Tablespoon (tbsp)", "volume", "us", 0.01478676478125, ["tbsp", "tablespoon", "tablespoons"]),
  U("floz", "Fluid ounce (fl oz)", "volume", "us", 0.0295735295625, ["floz", "fluidounce", "fluidounces"]),
  U("cup", "Cup", "volume", "us", 0.2365882365, ["cup", "cups"]),
  U("pt", "Pint (pt)", "volume", "us", 0.473176473, ["pt", "pint", "pints"]),
  U("qt", "Quart (qt)", "volume", "us", 0.946352946, ["qt", "quart", "quarts"]),
  U("gal", "Gallon (gal)", "volume", "us", 3.785411784, ["gal", "gallon", "gallons"]),
  U("impgal", "Imperial gallon", "volume", "imperial", 4.54609, ["impgal", "imperialgallon"]),

  // -- area (base: square metre) --------------------------------------------
  U("m2", "Square metre (m2)", "area", "metric", 1, ["m2", "m^2", "sqm", "squaremetre", "squaremeter"]),
  U("cm2", "Square centimetre (cm2)", "area", "metric", 1e-4, ["cm2", "cm^2", "sqcm"]),
  U("km2", "Square kilometre (km2)", "area", "metric", 1e6, ["km2", "km^2", "sqkm"]),
  U("ha", "Hectare (ha)", "area", "metric", 10000, ["ha", "hectare", "hectares"]),
  U("in2", "Square inch (in2)", "area", "imperial", 0.00064516, ["in2", "in^2", "sqin"]),
  U("ft2", "Square foot (ft2)", "area", "imperial", 0.09290304, ["ft2", "ft^2", "sqft"]),
  U("yd2", "Square yard (yd2)", "area", "imperial", 0.83612736, ["yd2", "yd^2", "sqyd"]),
  U("ac", "Acre (ac)", "area", "imperial", 4046.8564224, ["ac", "acre", "acres"]),
  U("mi2", "Square mile (mi2)", "area", "imperial", 2589988.110336, ["mi2", "mi^2", "sqmi"]),

  // -- pressure (base: pascal) ----------------------------------------------
  U("pa", "Pascal (Pa)", "pressure", "metric", 1, ["pa", "pascal", "pascals"]),
  U("kpa", "Kilopascal (kPa)", "pressure", "metric", 1000, ["kpa", "kilopascal", "kilopascals"]),
  U("mpa", "Megapascal (MPa)", "pressure", "metric", 1e6, ["mpa", "megapascal", "megapascals"]),
  U("bar", "Bar", "pressure", "metric", 100000, ["bar", "bars"]),
  U("mbar", "Millibar (mbar)", "pressure", "metric", 100, ["mbar", "millibar", "millibars"]),
  U("atm", "Atmosphere (atm)", "pressure", "other", 101325, ["atm", "atmosphere", "atmospheres"]),
  U("psi", "Pound per square inch (psi)", "pressure", "imperial", 6894.757293168, ["psi"]),
  U("mmhg", "Millimetre of mercury (mmHg)", "pressure", "other", 133.322387415, ["mmhg", "torr"]),
  U("inhg", "Inch of mercury (inHg)", "pressure", "imperial", 3386.389, ["inhg"]),

  // -- energy (base: joule) --------------------------------------------------
  U("j", "Joule (J)", "energy", "metric", 1, ["j", "joule", "joules"]),
  U("kj", "Kilojoule (kJ)", "energy", "metric", 1000, ["kj", "kilojoule", "kilojoules"]),
  U("cal", "Calorie (cal)", "energy", "other", 4.184, ["cal", "calorie", "calories"]),
  U("kcal", "Kilocalorie (kcal)", "energy", "other", 4184, ["kcal", "kilocalorie", "kilocalories"]),
  U("wh", "Watt hour (Wh)", "energy", "metric", 3600, ["wh", "watthour", "watthours"]),
  U("kwh", "Kilowatt hour (kWh)", "energy", "metric", 3.6e6, ["kwh", "kilowatthour", "kilowatthours"]),
  U("btu", "British thermal unit (BTU)", "energy", "imperial", 1055.05585262, ["btu", "btus"]),
  U("ftlb", "Foot pound (ft-lb)", "energy", "imperial", 1.3558179483314004, ["ftlb", "footpound", "footpounds"]),

  // -- power (base: watt) ----------------------------------------------------
  U("w", "Watt (W)", "power", "metric", 1, ["w", "watt", "watts"]),
  U("kw", "Kilowatt (kW)", "power", "metric", 1000, ["kw", "kilowatt", "kilowatts"]),
  U("mw", "Megawatt (MW)", "power", "metric", 1e6, ["megawatt", "megawatts"]),
  U("hp", "Horsepower (hp)", "power", "imperial", 745.6998715822702, ["hp", "horsepower"]),

  // -- time (base: second) ---------------------------------------------------
  U("s", "Second (s)", "time", "metric", 1, ["s", "sec", "secs", "second", "seconds"]),
  U("ms", "Millisecond (ms)", "time", "metric", 0.001, ["ms", "millisecond", "milliseconds"]),
  U("min", "Minute (min)", "time", "other", 60, ["min", "mins", "minute", "minutes"]),
  U("h", "Hour (h)", "time", "other", 3600, ["h", "hr", "hrs", "hour", "hours"]),
  U("d", "Day (d)", "time", "other", 86400, ["d", "day", "days"]),
  U("wk", "Week (wk)", "time", "other", 604800, ["wk", "week", "weeks"]),

  // -- speed (base: metre per second) ---------------------------------------
  U("mps", "Metre per second (m/s)", "speed", "metric", 1, ["mps"]),
  U("kph", "Kilometre per hour (km/h)", "speed", "metric", 1 / 3.6, ["kph", "kmh"]),
  U("mph", "Mile per hour (mph)", "speed", "imperial", 0.44704, ["mph"]),
  U("fps", "Foot per second (ft/s)", "speed", "imperial", 0.3048, ["fps"]),
  U("kn", "Knot (kn)", "speed", "other", 0.514444, ["kn", "knot", "knots"]),
];

/** Every quantity, in the order the picker shows them. */
export const QUANTITIES: Quantity[] = [
  "length", "mass", "volume", "area", "pressure", "energy", "power", "time", "speed",
];

/** The unit a quantity is measured in when nothing has been chosen. */
export const DEFAULT_UNITS: Record<Quantity, string> = {
  length: "m",
  mass: "kg",
  volume: "l",
  area: "m2",
  pressure: "pa",
  energy: "j",
  power: "w",
  time: "s",
  speed: "mps",
};

const BY_ID = new Map(UNITS.map((u) => [u.id, u]));

/** Look a unit up by its id. */
export function unitById(id: string | undefined): UnitDef | undefined {
  return id ? BY_ID.get(id.toLowerCase()) : undefined;
}

/** Look a unit up by anything it may be written as. */
export function unitByAlias(text: string): UnitDef | undefined {
  const t = text.trim().toLowerCase();
  if (!t) return undefined;
  return UNITS.find((u) => u.aliases.some((a) => a.toLowerCase() === t));
}

/** Every alias in the table, longest first, for matching against typed text. */
export function aliasesByLength(): { alias: string; unit: UnitDef }[] {
  const out: { alias: string; unit: UnitDef }[] = [];
  for (const unit of UNITS) for (const alias of unit.aliases) out.push({ alias, unit });
  return out.sort((a, b) => b.alias.length - a.alias.length);
}

/** The units of one quantity, grouped by system in the picker's order. */
export function unitsFor(quantity: Quantity): UnitDef[] {
  const order: System[] = ["metric", "imperial", "us", "other"];
  return UNITS.filter((u) => u.quantity === quantity).sort(
    (a, b) => order.indexOf(a.system) - order.indexOf(b.system) || a.label.localeCompare(b.label)
  );
}

/** Convert `n` from one unit to another. Different quantities give nothing. */
export function convert(n: number, from: UnitDef, to: UnitDef): number | undefined {
  if (from.quantity !== to.quantity) return undefined;
  return (n * from.factor) / to.factor;
}

/** The unit a quantity is read and written in, per the user's settings. */
export function preferredUnit(quantity: Quantity, chosen?: Record<string, string>): UnitDef {
  return unitById(chosen?.[quantity]) ?? unitById(DEFAULT_UNITS[quantity]) ?? UNITS[0];
}
