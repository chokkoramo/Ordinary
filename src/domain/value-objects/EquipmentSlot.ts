export enum EquipmentSlot {
  MAIN_HAND = "MAIN_HAND", // Weapons (Swords, Axes, Staves)
  OFF_HAND = "OFF_HAND",   // Shields, Tomes, Quivers
  HELMET = "HELMET",       // Helm / Crown / Cowl
  CHEST = "CHEST",         // Cuirass / Robes / Platemail
  BOOTS = "BOOTS",         // Greaves / Treads
  RING = "RING",           // Jewelry (Finger)
  AMULET = "AMULET",       // Jewelry (Neck)
}

export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = {
  [EquipmentSlot.MAIN_HAND]: "Main Hand",
  [EquipmentSlot.OFF_HAND]: "Off-Hand",
  [EquipmentSlot.HELMET]: "Helmet",
  [EquipmentSlot.CHEST]: "Chest Armor",
  [EquipmentSlot.BOOTS]: "Boots",
  [EquipmentSlot.RING]: "Ring",
  [EquipmentSlot.AMULET]: "Amulet",
};
