# NutriAI — API Route Specification

All endpoints are frontend-to-Gemini (Google Generative Language API) or localStorage operations. No backend server required for hackathon MVP.

**Base URL:** `https://generativelanguage.googleapis.com/v1beta`

## 1. Meal Plan Generation
**Endpoint:** `POST /models/gemini-1.5-pro:generateContent`
**Purpose:** Generate 7-day meal plan
**Rate limit:** 10 requests/minute (Gemini free tier)

### Request
```typescript
interface GenerateMealPlanRequest {
  user_profile: UserProfile;           // full profile
  food_database: FoodItem[];           // seed 50 items
  cycle_phase?: CyclePhase;            // if applicable
  budget_ngn: number;                  // daily budget
  excluded_foods: string[];          // food IDs to exclude
  previous_plan_id?: string;          // for "regenerate" context
}
```

### Response
```typescript
interface GenerateMealPlanResponse {
  meal_plan: MealPlan;                 // full plan object
  tokens_used: number;                  // for quota tracking
}
```

### Error Handling
| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 429 | Rate limited | Show "Please wait 30 seconds" |
| 400 | Bad prompt / schema mismatch | Log to console, show generic plan |
| 500 | Gemini error | Retry once, then show fallback plan |

## 2. Snap & Scan (Vision)
**Endpoint:** `POST /models/gemini-1.5-pro:generateContent`
**Purpose:** Identify dish from photo
**Rate limit:** 15 requests/minute

### Request
```typescript
interface SnapScanRequest {
  image_base64: string;                // JPEG, max 4MB
  food_database: FoodItem[];           // for reference matching
  user_conditions: string[];         // to flag relevant warnings
}
```

### Response
```typescript
interface SnapScanResponse {
  result: SnapScanResult;              // full scan result
  tokens_used: number;
}
```

## 3. AI Nutritionist Chat
**Endpoint:** `POST /models/gemini-1.5-pro:generateContent`
**Purpose:** Conversational nutrition advice
**Rate limit:** 20 requests/minute

### Request
```typescript
interface ChatRequest {
  message: string;                     // user's latest message
  user_profile: UserProfile;
  chat_history: ChatMessage[];         // last 10 messages for context
  language: 'english' | 'pidgin' | 'yoruba' | 'igbo' | 'hausa';
}
```

### Response
```typescript
interface ChatResponse {
  message: ChatMessage;                // assistant response
  tokens_used: number;
}
```

## 4. Onboarding Target Calculator
**Endpoint:** `POST /models/gemini-1.5-flash:generateContent`
**Purpose:** Compute daily nutrient targets from profile
**Rate limit:** 30 requests/minute

### Request
```typescript
interface CalculateTargetsRequest {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight_kg: number;
  height_cm: number;
  activity_level: string;
  goal: string;
  conditions: string[];
  is_pregnant: boolean;
  trimester?: number;
}
```

### Response
```typescript
interface CalculateTargetsResponse {
  targets: NutrientTargets;
  explanation: string;
}
```

## 5. localStorage Operations (Client-Side "API")
All persistence is localStorage. These are the CRUD operations.

```typescript
const LS_KEYS = {
  USER_PROFILE: 'nutriai_user_profile',
  MEAL_PLANS: 'nutriai_meal_plans',
  MEAL_LOGS: 'nutriai_meal_logs',
  CHAT_SESSION: 'nutriai_chat_session',
  FOOD_DB: 'nutriai_food_db',
  ONBOARDED: 'nutriai_onboarded',
  SETTINGS: 'nutriai_settings',
};

// User Profile
function getUserProfile(): UserProfile | null {
  return JSON.parse(localStorage.getItem(LS_KEYS.USER_PROFILE) || 'null');
}
function setUserProfile(profile: UserProfile): void {
  localStorage.setItem(LS_KEYS.USER_PROFILE, JSON.stringify(profile));
}

// Meal Plans (array, max 4)
function getMealPlans(): MealPlan[] {
  return JSON.parse(localStorage.getItem(LS_KEYS.MEAL_PLANS) || '[]');
}
function setMealPlans(plans: MealPlan[]): void {
  localStorage.setItem(LS_KEYS.MEAL_PLANS, JSON.stringify(plans.slice(0, 4)));
}
```

## 6. Error Handling & Fallbacks
### API Error Strategy
```typescript
class ApiError extends Error {
  constructor(public code: number, public body: string) {
    super(`API error ${code}: ${body}`);
  }
}
```

### Quota Management
```typescript
const QUOTA = {
  MEAL_PLAN: 10,      // per minute
  SNAP_SCAN: 15,      // per minute
  CHAT: 20,   
};
// Note: Document truncated from source.
```
