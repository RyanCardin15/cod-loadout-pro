/**
 * Loadout type definitions
 */

import { Tier, WeaponCategory } from './weapon';

export interface Attachment {
  id: string;
  name: string;
  slot: string;
}

export interface LoadoutWeapon {
  id: string;
  name: string;
  category: WeaponCategory;
  meta: {
    tier: Tier;
  };
}

export interface LoadoutWeaponDetails {
  weapon: LoadoutWeapon;
  attachments: Attachment[];
}

export interface LoadoutPerks {
  perk1?: string;
  perk2?: string;
  perk3?: string;
  perk4?: string;
}

export interface LoadoutEquipment {
  lethal?: string;
  tactical?: string;
  fieldUpgrade?: string;
}

export interface Loadout {
  id: string;
  userId: string;
  name: string;
  game: string;
  primary: LoadoutWeaponDetails;
  secondary?: LoadoutWeaponDetails;
  perks: LoadoutPerks;
  equipment: LoadoutEquipment;
  playstyle: string;
  effectiveRange: string;
  difficulty: string;
  overallRating?: number;
  favorites?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoadoutInput {
  userId: string;
  name: string;
  game: string;
  primary: LoadoutWeaponDetails;
  secondary?: LoadoutWeaponDetails;
  perks?: LoadoutPerks;
  equipment?: LoadoutEquipment;
  playstyle: string;
  effectiveRange?: string;
  difficulty?: string;
}
