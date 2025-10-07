export interface Weapon {
  id: string;
  name: string;
  game: "MW3" | "Warzone" | "BO6" | "MW2";
  category: "AR" | "SMG" | "LMG" | "Sniper" | "Marksman" | "Shotgun" | "Pistol";

  stats: {
    damage: number;
    range: number;
    accuracy: number;
    fireRate: number;
    mobility: number;
    control: number;
    handling: number;
  };

  ballistics: {
    damageRanges: Array<{ range: number; damage: number }>;
    ttk: { min: number; max: number };
    fireRate: number;
    magazineSize: number;
    reloadTime: number;
    adTime: number;
  };

  attachmentSlots: {
    optic?: string[];
    barrel?: string[];
    magazine?: string[];
    underbarrel?: string[];
    stock?: string[];
    laser?: string[];
    muzzle?: string[];
    rearGrip?: string[];
  };

  meta: {
    tier: "S" | "A" | "B" | "C" | "D";
    popularity: number;
    winRate: number;
    lastUpdated: string;
  };

  bestFor: string[];
  playstyles: string[];

  imageUrl: string;
  iconUrl: string;
}

export interface Attachment {
  id: string;
  name: string;
  slot: string;
  weaponCompatibility: string[];

  effects: {
    damage?: number;
    range?: number;
    accuracy?: number;
    fireRate?: number;
    mobility?: number;
    control?: number;
    handling?: number;
  };

  pros: string[];
  cons: string[];
  imageUrl?: string;
}

export interface Loadout {
  id?: string;
  userId?: string;
  name: string;
  game: string;

  primary: {
    weapon: Weapon;
    attachments: Attachment[];
  };

  secondary?: {
    weapon: Weapon;
    attachments: Attachment[];
  };

  perks: {
    perk1?: string;
    perk2?: string;
    perk3?: string;
    perk4?: string;
    bonus?: string;
    ultimate?: string;
  };

  equipment: {
    lethal?: string;
    tactical?: string;
    fieldUpgrade?: string;
  };

  playstyle: string;
  situation: string[];
  effectiveRange: "Close" | "Medium" | "Long" | "Versatile";
  difficulty: "Easy" | "Medium" | "Hard";

  overallRating?: number;
  createdAt?: string;
  updatedAt?: string;
  favorites?: number;

  description?: string;
  tips?: string[];
}

export interface UserProfile {
  userId: string;
  displayName?: string;

  playstyle: {
    primary: "Aggressive" | "Tactical" | "Sniper" | "Support";
    ranges: {
      close: number;
      medium: number;
      long: number;
    };
    pacing: "Rusher" | "Balanced" | "Camper";
    strengths?: string[];
  };

  games: string[];

  history: {
    queriedWeapons: string[];
    savedLoadouts: string[];
    playtimeByMode?: { [mode: string]: number };
  };

  favorites: string[];

  totalQueries: number;
  createdAt: string;
  lastActive: string;
}