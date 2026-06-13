"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, Upload, AlertCircle, CheckCircle2, Flame, Beef, Wheat, Droplet, Sparkles, RotateCcw, ImagePlus } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProfile, getMealLogForDate, saveMealLog } from "@/lib/storage";
import { UserProfile, MealLog, SnapScanResult } from "@/lib/types";

export default function TrackerPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<MealLog | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SnapScanResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (isLoaded && isSignedIn) {
      const p = getProfile();
      if (!p) router.push("/onboarding");
      else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(p);
        const today = new Date().toISOString().split("T")[0];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDailyLog(getMealLogForDate(today));
      }
    }
  }, [isLoaded, isSignedIn, router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!imageFile || !profile) return;
    setScanning(true);

    try {
      const base64Str = await fileToBase64(imageFile);

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Str }),
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();

      const result: SnapScanResult = {
        id: "scan-" + Date.now(),
        timestamp: new Date().toISOString(),
        image_base64: base64Str,
        identified_dish: data.identified_dish,
        confidence: data.confidence,
        portion_type: data.portion_type,
        foods_detected: data.foods_detected,
        total_nutrients: data.total_nutrients,
        gemini_explanation: data.explanation,
        clinical_flags: data.clinical_flags,
        added_to_log: true,
      };

      setScanResult(result);

      const today = new Date().toISOString().split("T")[0];
      const currentLog: MealLog = getMealLogForDate(today) || {
        id: "log-" + today,
        user_id: profile.id,
        date: today,
        entries: [],
        daily_totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, sugar_g: 0, cost_ngn: 0 } as MealLog["daily_totals"],
        target_adherence: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, sugar_g: 0, fiber_g: 0 } as MealLog["target_adherence"],
        scanned_meals: [],
      };

      currentLog.scanned_meals.push(result);
      currentLog.daily_totals.calories += result.total_nutrients.calories;
      currentLog.daily_totals.protein_g += result.total_nutrients.protein_g;
      currentLog.daily_totals.sodium_mg += result.total_nutrients.sodium_mg;

      saveMealLog(currentLog);
      setDailyLog(currentLog);
    } catch (err) {
      console.error(err);
      alert("Failed to scan image. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setScanResult(null);
  };

  if (!isLoaded || !profile) return <div className="min-h-screen bg-warm-white" />;

  const flags = scanResult?.clinical_flags;
  const hasFlags = flags && (flags.high_sodium || flags.high_gi || flags.iron_rich);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-forest bg-adire-grid text-warm-white">
        <div className="max-w-2xl mx-auto px-5 pt-10 pb-10">
          <p className="text-vitality-l text-label-brand mb-2">Snap &amp; Scan</p>
          <h1 className="text-h1-brand text-warm-white">Snap your jollof.</h1>
          <p className="text-warm-white/70 mt-2 max-w-lg leading-relaxed">
            We&apos;ll do the maths — macros, sodium, glycemic load, and flags for your conditions.
          </p>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────── */}
      <section className="bg-warm-white">
        <div className="max-w-2xl mx-auto px-5 -mt-6 pb-28">
          {/* ── Capture card ───────────────────────────────────── */}
          <div className="bg-white border border-forest/10 rounded-3xl shadow-sm p-4 mb-5 overflow-hidden">
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden mb-4 bg-forest/5 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Meal preview" className="w-full h-full object-cover" />

                {scanning && (
                  <div className="absolute inset-0 bg-forest/85 backdrop-blur-sm grid place-items-center text-warm-white">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-vitality/70 animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="flex flex-col items-center text-center px-6">
                      <div className="relative w-14 h-14 mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-warm-white/15" />
                        <div className="absolute inset-0 rounded-full border-2 border-vitality border-t-transparent animate-spin" />
                      </div>
                      <p className="text-label-brand text-vitality-l mb-1">Reading the plate</p>
                      <p className="text-base font-semibold text-warm-white">Identifying ingredients &amp; macros…</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-square rounded-2xl bg-forest bg-adire-grid text-warm-white grid place-items-center mb-4 transition-brand hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vitality"
                aria-label="Take or upload a meal photo"
              >
                <div className="flex flex-col items-center text-center px-6">
                  <div className="w-16 h-16 rounded-2xl bg-vitality grid place-items-center text-forest mb-4 shadow-lg shadow-vitality/20">
                    <Camera className="w-8 h-8" strokeWidth={2.2} />
                  </div>
                  <p className="text-warm-white font-semibold text-lg leading-tight">Tap to snap or upload</p>
                  <p className="text-warm-white/60 text-sm mt-1.5 max-w-xs">
                    Jollof, suya, egusi — works on any Nigerian dish, restaurant or home.
                  </p>
                </div>
              </button>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />

            <div className="flex gap-2">
              {imagePreview && !scanning && !scanResult && (
                <Button variant="outline" className="flex-1" onClick={reset}>
                  <RotateCcw className="w-4 h-4" /> Retake
                </Button>
              )}
              {imagePreview && !scanResult ? (
                <Button className="flex-1" onClick={handleScan} disabled={scanning}>
                  <Sparkles className="w-4 h-4" /> Scan meal
                </Button>
              ) : !imagePreview ? (
                <Button className="w-full" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="w-4 h-4" /> Upload from gallery
                </Button>
              ) : (
                <Button className="flex-1" onClick={reset}>
                  <Camera className="w-4 h-4" /> Scan another
                </Button>
              )}
            </div>
          </div>

          {/* ── Results card ───────────────────────────────────── */}
          {scanResult && (
            <div className="bg-white border border-forest/10 rounded-3xl shadow-sm p-5 mb-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-label-brand text-muted mb-1">Identified</p>
                  <h3 className="text-xl font-semibold text-forest leading-tight">{scanResult.identified_dish}</h3>
                </div>
                <Badge variant="vitality">
                  <CheckCircle2 className="w-3 h-3" />
                  {Math.round(scanResult.confidence * 100)}% match
                </Badge>
              </div>

              <p className="text-sm text-muted leading-relaxed mt-3 mb-5">{scanResult.gemini_explanation}</p>

              {/* Macros strip */}
              <div className="rounded-2xl border border-forest/10 overflow-hidden">
                <div className="grid grid-cols-4 divide-x divide-forest/5">
                  {[
                    { icon: Flame,   label: "Cals",  value: scanResult.total_nutrients.calories, unit: "",   accent: "text-suya" },
                    { icon: Beef,    label: "Pro",   value: scanResult.total_nutrients.protein_g, unit: "g", accent: "text-vitality-d" },
                    { icon: Wheat,   label: "Carbs", value: scanResult.total_nutrients.carbs_g, unit: "g",   accent: "text-forest" },
                    { icon: Droplet, label: "Fat",   value: scanResult.total_nutrients.fats_g, unit: "g",    accent: "text-uli-teal" },
                  ].map(({ icon: Icon, label, value, unit, accent }) => (
                    <div key={label} className="p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${accent}`} strokeWidth={2.4} />
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">{label}</span>
                      </div>
                      <p className="text-lg font-semibold text-forest tracking-tight leading-none">
                        {value}
                        {unit && <span className="text-xs font-medium text-muted ml-0.5">{unit}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical flags */}
              {hasFlags && (
                <div className="rounded-2xl bg-suya/10 border border-suya/20 p-4 mt-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-suya shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-suya mb-1">Heads up</p>
                    <div className="flex flex-wrap gap-1.5">
                      {flags?.high_sodium && <Badge variant="suya">High sodium</Badge>}
                      {flags?.high_gi && <Badge variant="suya">High glycemic index</Badge>}
                      {flags?.iron_rich && <Badge variant="vitality">Iron-rich · good</Badge>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Today's scans ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-label-brand text-muted">Today&apos;s scans</p>
              {dailyLog?.scanned_meals?.length ? (
                <span className="text-xs text-muted">{dailyLog.scanned_meals.length} logged</span>
              ) : null}
            </div>

            {dailyLog?.scanned_meals?.length ? (
              <ul className="space-y-2">
                {dailyLog.scanned_meals.map((scan) => (
                  <li
                    key={scan.id}
                    className="bg-white border border-forest/10 rounded-2xl p-3 flex items-center gap-3"
                  >
                    {scan.image_base64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/jpeg;base64,${scan.image_base64}`}
                        alt={scan.identified_dish}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-warm-white grid place-items-center shrink-0">
                        <Camera className="w-5 h-5 text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-forest text-sm leading-tight truncate">{scan.identified_dish}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {scan.total_nutrients.calories} kcal · {scan.total_nutrients.protein_g}g pro
                      </p>
                    </div>
                    {scan.clinical_flags?.high_sodium && <Badge variant="suya">Na</Badge>}
                    {scan.clinical_flags?.iron_rich && <Badge variant="vitality">Fe</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-white border border-dashed border-forest/15 rounded-2xl p-6 text-center">
                <p className="text-sm text-muted">No scans yet today. Snap your next meal.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </>
  );
}
