export enum AbacusStyle {
  SOROBAN = 'SOROBAN', // Japanese: 1 upper, 4 lower
  SUANPAN = 'SUANPAN', // Chinese: 2 upper, 5 lower
  SCHOOL = 'SCHOOL'    // IKEA/Rekenrek: 10 beads per row, horizontal
}

export interface BeadGroupConfig {
  count: number;
  value: number; // Value per bead
  position: 'top' | 'bottom' | 'row'; // 'row' for horizontal styles
  color?: string; // Optional override
  colors?: string[]; // Pattern for school style
}

export interface AbacusScheme {
  id: AbacusStyle;
  name: string;
  rods: number;
  orientation: 'vertical' | 'horizontal';
  groups: BeadGroupConfig[];
  placeValue: boolean; // True = powers of 10, False = sum
  frameColor: string;
  rodColor: string;
  beamColor?: string;
  beadShape: 'bicone' | 'round' | 'oval';
  beadColor: string;
}

export interface BeadState {
  val: number;
  active: boolean;
  pos: number; // 0 to 1, interpolation factor
}
