import { UserProfile, MealPlan, MealLog, ChatSession, FoodItem } from './types';

const KEYS = {
  PROFILE: 'nutriai_user_profile',
  PLANS: 'nutriai_meal_plans',
  LOGS: 'nutriai_meal_logs',
  CHAT: 'nutriai_chat_session',
  FOOD_DB: 'nutriai_food_db',
  ONBOARDED: 'nutriai_onboarded',
};

// Profile
export function getProfile(): UserProfile | null {
  const data = localStorage.getItem(KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  localStorage.setItem(KEYS.ONBOARDED, 'true');
}

export function isOnboarded(): boolean {
  return localStorage.getItem(KEYS.ONBOARDED) === 'true';
}

// Meal Plans
export function getMealPlans(): MealPlan[] {
  const data = localStorage.getItem(KEYS.PLANS);
  return data ? JSON.parse(data) : [];
}

export function saveMealPlan(plan: MealPlan): void {
  const plans = getMealPlans();
  plans.push(plan);
  // Keep latest 4
  if (plans.length > 4) plans.shift();
  localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
}

export function getLatestMealPlan(): MealPlan | null {
  const plans = getMealPlans();
  return plans.length > 0 ? plans[plans.length - 1] : null;
}

// Meal Logs
export function getMealLogs(): Record<string, MealLog> {
  const data = localStorage.getItem(KEYS.LOGS);
  return data ? JSON.parse(data) : {};
}

export function getMealLogForDate(dateStr: string): MealLog | null {
  const logs = getMealLogs();
  return logs[dateStr] || null;
}

export function saveMealLog(log: MealLog): void {
  const logs = getMealLogs();
  logs[log.date] = log;
  localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

// Chat Session
export function getChatSession(): ChatSession | null {
  const data = localStorage.getItem(KEYS.CHAT);
  return data ? JSON.parse(data) : null;
}

export function saveChatSession(session: ChatSession): void {
  localStorage.setItem(KEYS.CHAT, JSON.stringify(session));
}

// Food DB
export function getFoodDB(): FoodItem[] {
  const data = localStorage.getItem(KEYS.FOOD_DB);
  return data ? JSON.parse(data) : [];
}

export function saveFoodDB(foods: FoodItem[]): void {
  localStorage.setItem(KEYS.FOOD_DB, JSON.stringify(foods));
}
