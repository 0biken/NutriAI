"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Camera, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { fileToBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    if (isLoaded && !isSignedIn) return;
    if (isLoaded && isSignedIn) {
      const p = getProfile();
      if (!p) router.push("/onboarding");
      else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(p);
        const today = new Date().toISOString().split('T')[0];
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
      setScanResult(null); // Reset previous result
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
        body: JSON.stringify({ imageBase64: base64Str })
      });

      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      
      const result: SnapScanResult = {
        id: "scan-" + Date.now(),
        timestamp: new Date().toISOString(),
        image_base64: base64Str, // Optional: keep for UI
        identified_dish: data.identified_dish,
        confidence: data.confidence,
        portion_type: data.portion_type,
        foods_detected: data.foods_detected,
        total_nutrients: data.total_nutrients,
        gemini_explanation: data.explanation,
        clinical_flags: data.clinical_flags,
        added_to_log: true
      };

      setScanResult(result);

      // Add to daily log
      const today = new Date().toISOString().split('T')[0];
      const currentLog: MealLog = getMealLogForDate(today) || {
        id: "log-" + today,
        user_id: profile.id,
        date: today,
        entries: [],
        daily_totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, sugar_g: 0, cost_ngn: 0 } as MealLog["daily_totals"],
        target_adherence: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, sodium_mg: 0, sugar_g: 0, fiber_g: 0 } as MealLog["target_adherence"],
        scanned_meals: []
      };

      currentLog.scanned_meals.push(result);
      // Rough addition for UI demo
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

  if (!isLoaded || !profile) return <div className="min-h-screen bg-warm-white" />;

  return (
    <div className="min-h-screen bg-warm-white p-6 pt-12 max-w-lg mx-auto pb-24">
      <h1 className="text-3xl font-bold text-forest mb-2">Snap & Scan</h1>
      <p className="text-muted mb-8">Take a photo of your meal to instantly log macros and clinical risks.</p>

      {/* Upload/Camera Section */}
      <div className="bg-white rounded-2xl border border-forest/10 p-4 mb-6 shadow-sm overflow-hidden">
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden mb-4 bg-black/5 aspect-square flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            
            {scanning && (
              <div className="absolute inset-0 bg-forest/80 flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in">
                <div className="w-full h-1 bg-vitality/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]" />
                <Camera className="w-12 h-12 mb-4 animate-pulse" />
                <p className="font-semibold text-lg">Analyzing Dish...</p>
                <p className="text-xs text-white/70">Identifying ingredients & macros</p>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-dashed border-forest/20 rounded-xl flex flex-col items-center justify-center text-muted hover:bg-forest/5 hover:border-forest/40 transition-all mb-4"
          >
            <Camera className="w-12 h-12 mb-2 text-forest/40" />
            <p className="font-medium text-forest">Tap to snap a photo</p>
            <p className="text-xs">or upload from gallery</p>
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
            <Button variant="outline" className="w-full" onClick={() => { setImageFile(null); setImagePreview(null); }}>
              Retake
            </Button>
          )}
          <Button 
            className="w-full gap-2" 
            onClick={imagePreview && !scanResult ? handleScan : () => fileInputRef.current?.click()}
            disabled={scanning}
          >
            {imagePreview && !scanResult ? (
              <>Scan Meal</>
            ) : (
              <><Upload className="w-4 h-4" /> {scanResult ? "Scan Another" : "Select Photo"}</>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {scanResult && (
        <div className="bg-white rounded-2xl border border-forest/10 p-6 mb-8 shadow-sm animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Identified Meal</p>
              <h3 className="text-xl font-bold text-forest">{scanResult.identified_dish}</h3>
            </div>
            <div className="bg-vitality/20 text-forest text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {Math.round(scanResult.confidence * 100)}% Match
            </div>
          </div>
          
          <p className="text-sm text-forest-2 mb-6">{scanResult.gemini_explanation}</p>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-warm-white p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted uppercase">Cals</p>
              <p className="font-bold text-forest">{scanResult.total_nutrients.calories}</p>
            </div>
            <div className="bg-warm-white p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted uppercase">Pro</p>
              <p className="font-bold text-forest">{scanResult.total_nutrients.protein_g}g</p>
            </div>
            <div className="bg-warm-white p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted uppercase">Carbs</p>
              <p className="font-bold text-forest">{scanResult.total_nutrients.carbs_g}g</p>
            </div>
            <div className="bg-warm-white p-2 rounded-lg text-center">
              <p className="text-[10px] text-muted uppercase">Fat</p>
              <p className="font-bold text-forest">{scanResult.total_nutrients.fats_g}g</p>
            </div>
          </div>

          {(scanResult.clinical_flags?.high_sodium || scanResult.clinical_flags?.high_gi) && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Clinical Flags</p>
                <p className="text-xs text-red-600">
                  {scanResult.clinical_flags?.high_sodium && "High Sodium detected. "}
                  {scanResult.clinical_flags?.high_gi && "High Glycemic Index detected. "}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today's Log */}
      <div className="mb-4">
        <h3 className="font-bold text-forest mb-4">Today&apos;s Scans</h3>
        {dailyLog?.scanned_meals?.length ? (
          <div className="space-y-3">
            {dailyLog.scanned_meals.map(scan => (
              <div key={scan.id} className="bg-white p-3 rounded-xl border border-forest/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {scan.image_base64 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`data:image/jpeg;base64,${scan.image_base64}`} alt="Thumb" className="w-12 h-12 rounded-lg object-cover" />
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-warm-white flex items-center justify-center">🍽️</div>
                  )}
                  <div>
                    <p className="font-semibold text-forest text-sm">{scan.identified_dish}</p>
                    <p className="text-xs text-muted">{scan.total_nutrients.calories} kcal</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">You haven&apos;t scanned any meals today.</p>
        )}
      </div>
    </div>
  );
}
