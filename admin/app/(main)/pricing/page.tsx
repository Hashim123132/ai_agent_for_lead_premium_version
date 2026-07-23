"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generatePricingRecommendation, fetchBusinessProfile } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Sparkles,
  DollarSign,
  MapPin,
  TrendingUp,
} from "lucide-react";

const COUNTRIES = [
  { label: "United Arab Emirates", value: "UAE" },
  { label: "United States", value: "USA" },
  { label: "United Kingdom", value: "UK" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" },
  { label: "Germany", value: "Germany" },
  { label: "France", value: "France" },
  { label: "Italy", value: "Italy" },
  { label: "Spain", value: "Spain" },
  { label: "Saudi Arabia", value: "Saudi Arabia" },
  { label: "Qatar", value: "Qatar" },
  { label: "Kuwait", value: "Kuwait" },
  { label: "Oman", value: "Oman" },
  { label: "Bahrain", value: "Bahrain" },
  { label: "Egypt", value: "Egypt" },
  { label: "Turkey", value: "Turkey" },
  { label: "Singapore", value: "Singapore" },
  { label: "Malaysia", value: "Malaysia" },
  { label: "Thailand", value: "Thailand" },
  { label: "India", value: "India" },
];

const CITIES = [
  { label: "Dubai", value: "Dubai" },
  { label: "Abu Dhabi", value: "Abu Dhabi" },
  { label: "Houston", value: "Houston" },
  { label: "New York", value: "New York" },
  { label: "Los Angeles", value: "Los Angeles" },
  { label: "Miami", value: "Miami" },
  { label: "Chicago", value: "Chicago" },
  { label: "London", value: "London" },
  { label: "Paris", value: "Paris" },
  { label: "Berlin", value: "Berlin" },
  { label: "Riyadh", value: "Riyadh" },
  { label: "Doha", value: "Doha" },
  { label: "Kuwait City", value: "Kuwait City" },
  { label: "Muscat", value: "Muscat" },
  { label: "Manama", value: "Manama" },
  { label: "Cairo", value: "Cairo" },
  { label: "Istanbul", value: "Istanbul" },
  { label: "Singapore", value: "Singapore" },
  { label: "Kuala Lumpur", value: "Kuala Lumpur" },
  { label: "Bangkok", value: "Bangkok" },
  { label: "Mumbai", value: "Mumbai" },
  { label: "Toronto", value: "Toronto" },
];

const PROGRESS_STEPS = [
  "Analyzing inventory & pricing...",
  "Analyzing booking trends...",
  "Analyzing market trends...",
  "Generating pricing strategy...",
];

export default function PricingPage() {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBusinessProfile().then((res) => {
      if (res.profile) {
        if (!city && res.profile.city) setCity(res.profile.city);
        if (!country && res.profile.country) setCountry(res.profile.country);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (recommendation && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [recommendation]);

  async function handleGenerate() {
    if (!country.trim() && !city.trim()) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);
    setProgressMsg(PROGRESS_STEPS[0]);

    try {
      const result = await generatePricingRecommendation(
        city,
        country,
        (msg) => {
          setProgressMsg(msg);
        },
      );
      setRecommendation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgressMsg("");
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Pricing Recommendations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze inventory, booking trends, and market conditions to get
          data-driven pricing suggestions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4" />
            Generate Pricing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Country
              </label>
              <Combobox
                value={country}
                onChange={setCountry}
                options={COUNTRIES}
                placeholder="Select or type country..."
                searchPlaceholder="Search country..."
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3.5" />
                City
              </label>
              <Combobox
                value={city}
                onChange={setCity}
                options={CITIES}
                placeholder="Select or type city..."
                searchPlaceholder="Search city..."
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-xs text-muted-foreground">
            The agent will analyze inventory, booking data, and market trends
            {country || city ? ` for ${[city, country].filter(Boolean).join(", ")}` : ""}.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading || (!country.trim() && !city.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 size-4" />
                Generate Recommendations
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {loading && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-4 py-6">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Working on your analysis</p>
              <p className="text-xs text-muted-foreground">{progressMsg}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendation && !loading && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Pricing Recommendation</h2>
            <Badge variant="secondary">AI-Generated</Badge>
          </div>
          <Separator />
          <Card>
            <CardContent className="py-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {recommendation}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
