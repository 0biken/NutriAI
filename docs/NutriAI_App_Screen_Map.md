# NutriAI — App Screen Map

Every screen in the hackathon MVP, what lives on it, and how they connect. Navigation is bottom-tab on mobile, sidebar on desktop (responsive).

## Screen Flow Diagram

```text
[Entry] → Onboarding (4 steps) → Dashboard → [Bottom Tabs]
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                 Meal Plan            Tracker               Chat
                    │                     │                     │
              ┌─────┴─────┐          ┌────┴────┐           ┌────┴────┐
              │           │          │         │           │         │
           Day View   Generate    Today    History    New Chat   History
              │        Wizard      View     View      Screen    List
              │           │          │         │           │
           Meal Detail  Budget     Add Food  Calendar   Message
              │        Slider    (manual/   (month)    Detail
              │        Confirm     scan/      │
           Substitute   │        plan)    Day Detail
              Screen     │                     │
                         │                Macro Breakdown
                    [Modal Overlays]
                    - Food Search
                    - Serving Size Picker
                    - Preparation Variant Selector
                    - Budget Adjust Slider
```

## 1. Onboarding Flow (4 Steps)
**Route:** `/onboarding`
**Persistence:** Writes to localStorage key `nutriai_user_profile` on completion. Sets `nutriai_onboarded = 'true'`.

- **Step 1: Who You Are**
  - Inputs: Name, Age, Gender (radio: male / female / other), Weight (kg), Height (cm)
  - Validation: All required, age 13-100, weight 30-200, height 100-250
- **Step 2: Your Body & Goals**
  - Health conditions: None, Hypertension, Type 2 Diabetes, PCOS, Obesity, Pregnancy, Postpartum, Athlete
  - Goal: Weight loss, Muscle gain, Maintenance, Manage condition, Pregnancy nutrition
  - Activity level (slider): Sedentary → Very Active
- **Step 3: Cycle & Budget (conditional)**
  - If gender === 'female': Show cycle tracking opt-in
  - Budget input: Monthly budget in NGN
  - Dietary restrictions (multi-select chips)
- **Step 4: Targets & Done**
  - Gemini call to generateTargets()
  - Loading state: "Calculating your nutrition targets..."
  - Results preview
  - CTA: "Start eating better" → redirects to `/dashboard`

## 2. Dashboard (Home)
**Route:** `/` (default after onboarding)
**Layout:** Greeting + today's snapshot + quick actions + next meal preview

- **Top Section:** Greeting + Date + weather-like "nutrition climate"
- **Today's Snapshot Card:**
  - Circular progress: Calories consumed / target
  - Macro bars: Protein, Carbs, Fat
  - Budget: "₦X spent today · ₦Y remaining"
- **Next Meal Preview:** Next upcoming meal from active meal plan
- **Quick Actions (2×2 grid):**
  - "View meal plan" → Meal Plan tab
  - "Snap & Scan" → opens camera overlay
  - "Ask NutriAI" → Chat tab
  - "Adjust budget" → Budget slider modal

## 3. Meal Plan Tab
**Route:** `/plan`
**State:** Displays latest generated plan. Empty state prompts generation.

- **Week View (default):** Horizontal scroll of 7 day cards
- **Day View:** Vertical list: Breakfast → Lunch → Dinner → Snack
- **Meal Detail (modal/overlay):** Meal name + description, food breakdown, preparation notes
- **Generate Wizard (modal, 3 steps):** Confirm constraints, cycle phase auto-detected, review & generate

## 4. Tracker Tab
**Route:** `/tracker`
**State:** Daily food diary. One log per day.

- **Today View (default):** Date header with calendar picker, meal slots
- **Add Food Overlay (3 entry methods):**
  - Search database
  - Snap & Scan
  - From meal plan
- **Daily Summary (bottom sheet):** Nutrient totals vs targets, cost total vs daily budget
- **History View:** Calendar heatmap (month view)

## 5. Chat Tab
**Route:** `/chat`
**State:** Persistent conversation. One session per user.

- **Chat Screen:** Messages bubble list (user right, assistant left)
- **Input bar:** Text field + send button + language selector
- **Message Detail:** Full text view, cited sources list
- **New Chat:** Confirmation modal to archive old session

## 6. Profile / Settings
**Route:** `/profile`

- **My Profile:** Editable (Name, weight, height, activity level)
- **Health & Conditions:** Condition chips, goal selector
- **Budget & Preferences:** Monthly budget slider, restrictions
- **Nutrition Targets:** View-only display, recalculate button
- **Data & Privacy:** Export data, clear all data

## 7. Shared Components / Overlays
- Food Search Modal
- Serving Size Picker
- Preparation Variant Selector
- Budget Adjust Slider
- Snap & Scan Camera
