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
import { generateLeadsStream, fetchBusinessProfile } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2,
  Sparkles,
  MapPin,
  Target,
  Users,
  Search,
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
  "Searching for leads...",
  "Saving lead to CRM...",
  "Generating lead strategy...",
];

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<string | null>(null);
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
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleGenerate() {
    if (!country.trim() && !city.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgressMsg(PROGRESS_STEPS[0]);

    try {
      const res = await generateLeadsStream(
        query,
        city,
        country,
        (msg) => {
          setProgressMsg(msg);
        },
      );
      setResult(res);
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
          Lead Generation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find, qualify, and generate outreach drafts for potential business
          partners — hotels, travel agencies, corporate clients, and more.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" />
            Search for Business Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              What type of partners are you looking for?
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Hotels and resorts in downtown Dubai near airports, or travel agencies specializing in corporate travel..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
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
            The agent will search the web, qualify leads, and save them to the
            CRM with personalized outreach drafts.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading || (!country.trim() && !city.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Search className="mr-1.5 size-4" />
                Find Leads
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {loading && (
        <Card className="border-primary/30">
          <CardContent className="flex items-center gap-4 py-6">
            <Loader2 className="size-6 animate-spin text-primary" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Working on lead generation</p>
              <p className="text-xs text-muted-foreground">{progressMsg}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Lead Generation Report</h2>
            <Badge variant="secondary">AI-Generated</Badge>
          </div>
          <Separator />
          <Card>
            <CardContent className="py-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {result}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
