"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  Search,
  X,
  ExternalLink,
  Lightbulb,
  ImageIcon,
  Globe,
  Layers,
  ImageOff,
} from "lucide-react";
import type { AdSuggestion, AdAnalysis, SearchMode } from "@/lib/api";
import { searchAdSuggestions } from "@/lib/api";

const LOADING_MESSAGES: Record<SearchMode, string> = {
  web: "Scanning competitor websites & promotions...",
  deep: "Searching social, search ads, offers & trends...",
  pinterest: "Searching Pinterest for ad inspiration...",
};

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "size-4"}>
      <path d="M12 0C5.372 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.628 0 12-5.372 12-12S18.628 0 12 0z" />
    </svg>
  );
}

export default function AdSuggestionsPage() {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<SearchMode>("web");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ads, setAds] = useState<AdSuggestion[] | null>(null);
  const [analysis, setAnalysis] = useState<AdAnalysis | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdSuggestion | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  async function handleSearch() {
    if (!country.trim() && !city.trim()) return;

    setLoading(true);
    setError(null);
    setAds(null);
    setAnalysis(null);
    setAnalysisLoading(true);

    try {
      await searchAdSuggestions(
        country.trim(),
        city.trim(),
        goal.trim(),
        mode,
        (fetchedAds) => {
          setAds(fetchedAds);
          setLoading(false);
          setTimeout(() => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        },
        (fetchedAnalysis) => {
          setAnalysis(fetchedAnalysis);
          setAnalysisLoading(false);
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setLoading(false);
      setAnalysisLoading(false);
    }
  }

  useEffect(() => {
    if (selectedAd) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedAd]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ad Suggestions</h1>
        <p className="mt-1 text-muted-foreground">
          Search competitor car rental ads for inspiration, then get AI-powered
          pattern analysis.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">Search Mode</label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={mode === "pinterest" ? "pinterest" : "web"}
                onValueChange={(v) => setMode(v as "web" | "pinterest")}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">
                    <span className="flex items-center gap-2">
                      <Globe className="size-3.5" />
                      Search Online
                    </span>
                  </SelectItem>
                  <SelectItem value="pinterest">
                    <span className="flex items-center gap-2">
                      <PinterestIcon className="size-3.5" />
                      Pinterest Only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={() => setMode("deep")}
                className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                  mode === "deep"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Layers className="size-4" />
                Deep Search
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {mode === "web"
                ? "Competitor sites, landing pages, promotions"
                : mode === "pinterest"
                  ? "Strictly Pinterest boards & pins for ad inspiration"
                  : "Social + search + offers + trends (slower)"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Country</label>
              <Input
                placeholder="e.g. UAE, USA"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">City</label>
              <Input
                placeholder="e.g. Dubai, Houston"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Goal</label>
              <Textarea
                placeholder="e.g. promote luxury SUVs"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="min-h-[40px]"
                rows={1}
              />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || (!country.trim() && !city.trim())}
            className="mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 size-4" />
                Search Competitor Ads
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{LOADING_MESSAGES[mode]}</p>
          </CardContent>
        </Card>
      )}

      {ads && ads.length > 0 && (
        <div ref={galleryRef}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Competitor Ads
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({ads.length} found)
              </span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ads.map((ad, i) => (
              <button
                key={i}
                onClick={() => setSelectedAd(ad)}
                className="group cursor-pointer overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div className="img-fallback hidden absolute inset-0 flex items-center justify-center bg-muted">
                    <ImageOff className="size-8 text-muted-foreground/50" />
                  </div>
                  <Badge className="absolute left-2 top-2 bg-black/70 text-white hover:bg-black/70">
                    {ad.brand}
                  </Badge>
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    <ImageIcon className="size-5" />
                    <span className="text-sm font-medium">Preview</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {ad.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {ads && ads.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ImageIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No competitor ads found. Try different search terms or mode.</p>
          </CardContent>
        </Card>
      )}

      {analysisLoading && ads && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing competitor patterns...</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-5 text-primary" />
              AI Pattern Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <AnalysisField label="Observed Ad" value={analysis.observed_ad} />
              <AnalysisField label="Creative Pattern" value={analysis.creative_pattern} />
              <AnalysisField label="Attention Signals" value={analysis.attention_signals} />
              <AnalysisField label="Suggested Adaptation" value={analysis.suggested_adaptation} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Confidence:</span>
              <ConfidenceBadge level={analysis.confidence} />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedAd(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-medium text-muted-foreground">Ad Preview</span>
              <button
                onClick={() => setSelectedAd(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="relative aspect-video bg-muted">
                <img
                  src={selectedAd.image_url}
                  alt={selectedAd.title}
                  className="size-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div className="img-fallback hidden absolute inset-0 flex items-center justify-center bg-muted">
                  <ImageOff className="size-12 text-muted-foreground/50" />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <Badge>{selectedAd.brand}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Captured: {new Date(selectedAd.captured_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{selectedAd.title}</p>
                {selectedAd.content && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedAd.content}</p>
                )}
                {selectedAd.source_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedAd.source_url, "_blank", "noopener")}
                  >
                    <ExternalLink className="mr-2 size-4" />
                    View Source
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <p className="mb-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    high: { variant: "default", label: "High" },
    medium: { variant: "secondary", label: "Medium" },
    low: { variant: "destructive", label: "Low" },
  };
  const { variant, label } = variants[level?.toLowerCase()] ?? { variant: "secondary" as const, label: level || "Unknown" };
  return <Badge variant={variant}>{label}</Badge>;
}
