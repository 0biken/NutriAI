# NutriAI — Application / Pitch Answers

> Draft answers for a Nigerian innovation grant / competition application, grounded in the actual codebase (Next.js 16 + Clerk + Google Gemini 2.5-flash, deployed at https://nutri-ai-s8v9.vercel.app). Edit tone/length to match the form's word limits before submitting.

---

## 1. What problem does your solution address?

Nigeria faces a quietly escalating nutrition-driven health crisis. Roughly **38% of adults are hypertensive**, **5.7% live with diabetes** (projected to double by 2045), and **over half of women of reproductive age are anaemic** — and food, more than any other lever, is what shifts those numbers. Yet the average Nigerian has almost no access to credible, culturally relevant nutrition guidance: the country has **fewer than one registered dietitian per 100,000 people**, far below WHO recommendations, and they're concentrated in private hospitals in Lagos and Abuja.

The people most affected — middle-income urban Nigerians managing hypertension, type-2 diabetes, PCOS, pregnancy, or obesity — fall back on three poor options:

1. **Western nutrition apps** (MyFitnessPal, Noom, Lose It) that have never heard of egusi, eba, suya, or ugu, can't budget in naira, and assume access to kale, quinoa, and almond milk.
2. **Generic social-media advice** that's culturally familiar but clinically untested.
3. **Sporadic GP visits** that produce a printed handout the patient can't translate into what to actually cook tomorrow.

The result is widespread, expensive non-compliance: people with hypertension still seasoning with Maggi cubes, women in their luteal phase craving exactly the foods that worsen PMS, gestational diabetics eating pounded yam they were told was "safe Nigerian food." Nothing on the market closes the loop between **Nigerian food, clinical condition, and budget** in one place.

## 2. Describe your technology-driven solution

**NutriAI is a mobile-first clinical nutrition assistant trained around Nigerian food, conditions, languages, and household budgets.** Three core capabilities, all powered by Google Gemini under a structured clinical-protocol layer:

- **Personalized 7-day meal planner.** Generates a weekly plan in naira, respecting the user's daily budget, dietary restrictions, active health conditions (hypertension → DASH-style sodium < 1500mg; diabetes → low glycemic load; PCOS → anti-inflammatory + magnesium; pregnancy → folate + iron), and — for female users — current menstrual-cycle phase. Each meal carries a clinical annotation ("+Iron", "Low GI", "Low Sodium") and a smart substitute.
- **Snap & Scan.** User photographs their plate; Gemini Vision identifies the dish ("Egusi soup with pounded yam"), estimates portion size in buka / home-cooked / restaurant terms, returns macro + clinically relevant micro nutrients (sodium for hypertensives, GI for diabetics, iron for anaemic women), and flags clinical risks inline.
- **Conversational AI nutritionist** with retrieval over Nigerian-specific clinical protocols, capable of replying in **Nigerian English, Pidgin, Yoruba, Igbo, or Hausa** depending on how the user writes.

**Stack:** Next.js 16 (App Router, React 19) on Vercel, Clerk for authentication, Google Gemini 2.5-flash for all AI (chat, structured meal-plan JSON, and image-grounded scanning), a curated Nigerian food database with clinically validated macro/micro/glycemic data, and a hand-written clinical-protocols layer that grounds every AI response to evidence-based guidance for the five conditions above. Tailwind for the UI; mobile-first design for low-end Android.

## 3. Why is this innovation important for Nigeria?

Nigeria is **220+ million people**, urbanising fast, with smartphone penetration past 50% and climbing. The same demographic shift is producing a **non-communicable-disease wave**: the IDF estimates Nigerian diabetes prevalence will roughly double by 2045; the Nigerian Hypertension Society puts adult hypertension prevalence at 38%; maternal-mortality and anaemia rates remain among the world's highest. Every one of those conditions is **food-modifiable** — and not one of them has a culturally fluent digital tool serving it at scale.

NutriAI maps directly onto Nigeria's **National Digital Economy Policy and Strategy (NDEPS 2020–2030)**, specifically the *Digital Society & Emerging Technologies* and *Digital Services Development* pillars, and onto **SDG 3 (Good Health and Well-Being)** and **SDG 2 (Zero Hunger)**. It also showcases sovereign AI use: clinical knowledge encoded in Nigeria's food vocabulary, not bolted onto a Western model.

**Market.** The serviceable obtainable market — urban Nigerian adults 25–55 with smartphones who are managing or at risk of one of the five target conditions — is conservatively **6–8 million people**. At a freemium model with B2C subscriptions plus B2B layers (HMOs, employer wellness programmes, antenatal clinics, gym chains), capturing even 1% yields a healthy seven-figure-USD recurring-revenue line while measurably reducing condition-driven hospital visits — directly relieving public-health spend.

**Social impact.** Fewer hypertensive emergencies, better gestational-diabetes outcomes, lower maternal anaemia, more nutrition literacy in five Nigerian languages — delivered through the phone people already own, in foods they already eat, at prices they can already pay.

## 4. Who are your target audience?

**Primary user: the health-aware urban Nigerian aged 25–45.**

- **Demographics.** Middle-income (₦200k–₦1.5m monthly household income), based in Lagos, Abuja, Port Harcourt, Ibadan, Kano; smartphone-first; comfortable in English plus at least one Nigerian language; spends ₦40k–₦150k monthly on household food.
- **Core characteristic.** Either *recently diagnosed* with hypertension, type-2 diabetes, or PCOS — or actively managing pregnancy, postpartum, or weight loss — and motivated to act, but stuck without a usable plan.
- **Behaviours.** Already uses health-tracking apps (steps, period, sleep), follows Nigerian wellness influencers on Instagram and TikTok, asks WhatsApp groups about food and supplements, occasionally pays for a one-off dietitian consultation but doesn't sustain follow-up.
- **Pain points.** Western nutrition apps don't know Nigerian food. Doctors give general advice ("cut salt", "watch carbs") with no concrete daily plan. Cooking for a household budget while respecting a clinical condition is mental overhead they don't have. Nigerian women specifically have no app that ties cycle phase, PCOS, and food together.
- **How they currently cope.** Guessing, generic Google searches, copy-pasting Instagram meal lists, paying ₦15k–₦50k once for a static PDF meal plan that becomes irrelevant after one week.

**Secondary audiences** (post-launch): antenatal clinics, HMOs (Reliance, Hygeia, AXA Mansard) looking to reduce claims on lifestyle conditions, and corporate wellness teams in banking and oil-and-gas.

## 5. What stage is your solution currently at?

**Working MVP / functional prototype**, publicly deployed at https://nutri-ai-s8v9.vercel.app. All three AI flows are end-to-end operational: onboarding → personalized targets → 7-day meal-plan generation → photo-scan logging → multilingual chat. Built on production infrastructure (Vercel, Clerk auth, Google Gemini 2.5-flash). Pre-revenue, pre-public launch; ready for closed beta with a target user cohort and grant-funded expansion of the food database, condition coverage, and Nigerian-language fine-tuning.

> The form likely offers options like *Idea / Concept · Prototype · MVP · Early Revenue · Scaling*. Pick **MVP** (or **Prototype** if MVP isn't offered) — the product works end-to-end on real infrastructure but has no paying users yet.

---

## Notes for the submitter

- Numbers to verify against your latest sources before submitting: 38% adult HTN prevalence, 5.7% diabetes, smartphone penetration. Broadly correct but pick the citation that matches what the judges expect (NHS, IDF, NCC, NBS).
- "First Nigerian clinical nutrition app" — that's the framing the codebase header uses. Quick competitor scan before submission: HealthLane, Reliance Family Medicine, Tremendoc — none do food-first cycle-aware planning, but worth confirming.
- The cycle-syncing + multilingual angles are real differentiators against any Western app and worth emphasising more than I did here if word count allows.
