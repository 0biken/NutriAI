export interface UserProfile {
  id: string;                          // uuid, generated on first load
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight_kg: number;
  height_cm: number;

  // Health conditions (multi-select on onboarding)
  conditions: Array<
    | 'none'
    | 'hypertension'
    | 'type2_diabetes'
    | 'pcos'
    | 'obesity'
    | 'pregnancy'
    | 'postpartum'
    | 'athlete'
  >;

  // Goals (single select)
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'manage_condition' | 'pregnancy_nutrition';

  // Budget
  monthly_budget_ngn: number;          // e.g. 15000
  daily_budget_ngn: number;            // derived: monthly / 30

  // Activity
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  // Dietary
  dietary_restrictions: string[];      // e.g. ['no_pork', 'no_shellfish']
  disliked_foods: string[];            // food IDs the user has rejected

  // Cycle (only populated if gender === 'female')
  cycle?: CycleData;

  // Computed targets (set after onboarding, updated by AI)
  daily_targets: NutrientTargets;

  created_at: string;                  // ISO date string
}

export interface NutrientTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;

  // Clinically significant micros — tracked for conditions
  sodium_mg: number;       // critical for hypertension (target: <1500mg DASH)
  sugar_g: number;
  fiber_g?: number;         // diabetes glycemic control
  iron_mg?: number;         // critical for menstrual / pregnancy
  folate_mcg?: number;      // critical for pregnancy
  calcium_mg?: number;
  potassium_mg?: number;    // hypertension support
  magnesium_mg?: number;    // PCOS / luteal phase
}

export interface FoodItem {
  id: string;                          // e.g. 'egusi_soup'
  name: string;                        // 'Egusi soup'
  serving_size_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sodium_mg: number;
  glycemic_index: number;
}

export type FoodCategory =
  | 'swallow'        // eba, amala, pounded yam, semo, tuwo
  | 'soup'           // egusi, ogbono, efo riro, banga, okra
  | 'protein'        // suya, grilled fish, moi moi, akara, beans
  | 'rice_grains'    // jollof, ofada, rice and stew, millet
  | 'snack'          // chin chin, boli, plantain chips
  | 'breakfast'      // pap/ogi, akara, agege bread, yam and egg
  | 'drink'          // zobo, kunu, palm wine, tiger nut
  | 'fruit_veg'      // ugu leaves, tomatoes, plantain, yam
  | 'condiment';     // palm oil, groundnut oil, maggi, crayfish

export interface MealPlan {
  id: string;
  user_id: string;
  generated_at: string;                // ISO date string
  week_start: string;                  // ISO date string (Monday)

  // Context used to generate this plan
  context: {
    cycle_phase?: CyclePhase;
    budget_ngn: number;
    active_conditions: string[];
    goal: string;
  };

  days: DayPlan[];

  // Weekly summary
  weekly_totals: {
    avg_daily_calories: number;
    avg_daily_cost_ngn: number;
    estimated_monthly_cost_ngn: number;
    nutritional_completeness_score: number; // 0–100, how well it hits targets
  };

  // AI-generated explanation (shown in UI)
  plan_summary: string;                // e.g. "This plan prioritises iron-rich foods for your menstrual phase..."
  clinical_notes?: string;             // condition-specific note from AI
}

export interface DayPlan {
  day_index: number;                   // 0 = Monday, 6 = Sunday
  date: string;
  cycle_phase_note?: string;           // e.g. "Day 18 – Luteal phase. Prioritising magnesium."

  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack?: Meal;
  };

  daily_totals: NutrientTargets & {
    cost_ngn: number;
  };

  // Compared to user's targets
  target_adherence: {
    calories_pct: number;              // e.g. 96 = 96% of target
    protein_pct: number;
    sodium_pct: number;                // lower is better for hypertension
  };
}

export interface Meal {
  name: string;                        // e.g. 'Akara + Pap'
  description?: string;                // e.g. 'Light, protein-forward breakfast'
  foods: MealFood[];
  preparation_notes?: string;          // e.g. 'Use less palm oil — reduces sodium by ~40mg'

  totals: NutrientTargets & {
    cost_ngn: number;
    cost_breakdown: string;            // e.g. 'Akara ₦200 · Pap ₦80'
  };

  // Cycle / condition annotation shown as badge in UI
  annotation?: {
    label: string;                     // e.g. '+Iron' or 'Low GI'
    reason: string;                    // e.g. 'Ugu is your best local source of iron'
  };

  // Smart substitute (shown when tapped)
  substitute?: {
    name: string;
    reason: string;
    cost_ngn: number;
    calorie_delta: number;
  };
}

export interface MealFood {
  food_id: string;                     // references FoodItem.id
  food_name: string;                   // denormalized for display
  serving_label: string;               // e.g. '1 medium bowl'
  grams: number;
  calories: number;
  preparation?: string;                // e.g. 'boiled', 'fried'
}

export interface CycleData {
  last_period_start: string;           // ISO date string
  cycle_length_days: number;           // default 28
  period_length_days: number;          // default 5
  has_pcos: boolean;

  // Computed — recalculate on each app load
  current_phase: CyclePhase;
  current_day: number;                 // day within current cycle
  days_until_next_period: number;
  next_phase_in_days: number;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const CYCLE_PHASE_CONFIG: Record<CyclePhase, {
  days: string;                        // e.g. 'Days 1–5'
  color: string;                       // UI accent hex
  focus_nutrients: string[];
  avoid: string[];
  ui_label: string;
  clinical_rationale: string;
}> = {
  menstrual: {
    days: 'Days 1–5',
    color: '#E8651A',
    focus_nutrients: ['iron', 'vitamin_c', 'omega3', 'anti_inflammatory'],
    avoid: ['excessive_caffeine', 'high_sodium'],
    ui_label: 'Menstrual',
    clinical_rationale: 'Average iron loss 30–40mg per cycle. Nigerian women have high baseline anaemia rates.'
  },
  follicular: {
    days: 'Days 6–14',
    color: '#A8E063',
    focus_nutrients: ['b_vitamins', 'lean_protein', 'complex_carbs'],
    avoid: [],
    ui_label: 'Follicular',
    clinical_rationale: 'Rising oestrogen increases insulin sensitivity — optimal window for complex carbohydrates.'
  },
  ovulation: {
    days: 'Day 14',
    color: '#6DBF5A',
    focus_nutrients: ['antioxidants', 'omega3', 'hydration'],
    avoid: [],
    ui_label: 'Ovulation',
    clinical_rationale: 'Prostaglandin production peaks — anti-inflammatory foods reduce cramping severity.'
  },
  luteal: {
    days: 'Days 15–28',
    color: '#E8651A',
    focus_nutrients: ['magnesium', 'complex_carbs', 'b6', 'tryptophan'],
    avoid: ['refined_sugar', 'alcohol', 'excess_caffeine'],
    ui_label: 'Luteal',
    clinical_rationale: 'Progesterone raises metabolic rate 5–10%. Magnesium deficiency correlates with PMS severity.'
  }
};

export interface MealLog {
  id: string;
  user_id: string;
  date: string;                        // 'YYYY-MM-DD'
  cycle_phase?: CyclePhase;

  entries: LogEntry[];

  daily_totals: NutrientTargets & {
    cost_ngn: number;
  };

  // vs. user's daily targets
  target_adherence: Record<keyof NutrientTargets, number>; // percentage

  // Snap & Scan results attached to this log
  scanned_meals: SnapScanResult[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id: string;
  food_name: string;
  serving_label: string;
  grams: number;
  source: 'manual' | 'meal_plan' | 'snap_scan';
  nutrients: NutrientTargets;
  cost_ngn?: number;
}

export interface SnapScanResult {
  id: string;
  timestamp: string;
  image_base64?: string;               // stored locally only, never sent to backend
  identified_dish: string;
  confidence: number;                  // 0–1
  portion_type: 'buka' | 'home_cooked' | 'restaurant' | 'unknown';
  foods_detected: {
    food_id?: string;                  // null if not in database
    food_name: string;
    estimated_grams: number;
  }[];
  total_nutrients: NutrientTargets;
  gemini_explanation: string;          // raw text from Gemini for display
  added_to_log: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  started_at: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: 'english' | 'pidgin' | 'yoruba' | 'igbo' | 'hausa';  // detected or selected
  sources?: string[];                  // clinical protocol references cited by AI
}
