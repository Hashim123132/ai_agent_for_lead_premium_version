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
import { generateLeadsStream, fetchBusinessProfile, saveLead, type Lead } from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  MapPin,
  Target,
  Users,
  Search,
  Phone,
  ExternalLink,
  X,
  Building2,
  Mail,
  CheckCircle2,
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

const SCORE_VARIANT = (score: number): "default" | "secondary" | "destructive" | "outline" => {
  if (score >= 70) return "default";
  if (score >= 50) return "secondary";
  return "outline";
};

interface TempLead extends Lead {
  _temp?: boolean;
}

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<TempLead[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBusinessProfile().then((res) => {
      if (res.profile) {
        if (!city && res.profile.city) setCity(res.profile.city);
        if (!country && res.profile.country) setCountry(res.profile.country);
      }
    }).catch(() => {});
  }, []);

  // Scroll results into view when they arrive
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleGenerate() {
    if (!country.trim() && !city.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    setLeads([]);
    setProgressMsg(PROGRESS_STEPS[0]);

    try {
      const res = await generateLeadsStream(
        query,
        city,
        country,
        (msg) => {
          setProgressMsg(msg);
        },
        (lead) => {
          setLeads((prev) => [...prev, { ...lead, _temp: true }]);
        },
        (parsedLeads) => {
          setLeads(parsedLeads);
        },
        controller.signal,
      );
      setResult(res);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setProgressMsg("Cancelled");
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  async function handleAddToCrm(lead: Lead) {
    setSavingId(lead.business_name);
    try {
      await saveLead(lead);
      setLeads((prev) =>
        prev.map((l) =>
          l.business_name === lead.business_name ? { ...l, status: "Saved to CRM" } : l,
        ),
      );
    } catch {
      // silently fail — the card stays unchanged
    } finally {
      setSavingId(null);
    }
  }

  function formatContact(value: string): { type: "phone" | "email" | "web" | "text"; href: string; label: string } {
    const trimmed = value.trim();
    if (/^[\d\s\-–—.+()]{6,}$/.test(trimmed)) {
      return { type: "phone", href: `tel:${trimmed.replace(/[^\d+]/g, "")}`, label: trimmed };
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { type: "email", href: `mailto:${trimmed}`, label: trimmed };
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return { type: "web", href: trimmed, label: trimmed.replace(/^https?:\/\//, "") };
    }
    return { type: "text", href: "", label: trimmed || "—" };
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
            <label htmlFor="lead-query" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              What type of partners are you looking for?
            </label>
            <textarea
              id="lead-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Hotels and resorts in downtown Dubai near airports, or travel agencies specializing in corporate travel..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="lead-country" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Country
              </label>
              <Combobox
                id="lead-country"
                value={country}
                onChange={setCountry}
                options={COUNTRIES}
                placeholder="Select or type country..."
                searchPlaceholder="Search country..."
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lead-city" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3.5" />
                City
              </label>
              <Combobox
                id="lead-city"
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
          <CardContent className="flex items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-6 rounded-full" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">Working on lead generation</p>
                <p className="text-xs text-muted-foreground">{progressMsg}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="mr-1 size-3.5" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {leads.length > 0 && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Leads Found</h2>
            <Badge variant="secondary">{leads.length} result{leads.length !== 1 ? "s" : ""}</Badge>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            {leads.map((lead) => {
              const contact = formatContact(lead.contact_info);
              const isSaved = lead.status === "Saved to CRM" || lead.status === "New";
              return (
                <Card key={lead.business_name + lead.contact_info} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        {lead.business_name}
                      </CardTitle>
                      <Badge variant={SCORE_VARIANT(lead.score)} className="shrink-0 text-[10px]">
                        {lead.score}/100
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{lead.lead_type}</p>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-1.5 pb-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span>{lead.lead_type}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {contact.type === "text" ? (
                        <span className="break-all">{contact.label}</span>
                      ) : (
                        <a
                          href={contact.href}
                          className="break-all text-primary underline underline-offset-2 hover:text-primary/80"
                        >
                          {contact.label}
                        </a>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true">
                        ●
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {lead.status}
                      </Badge>
                    </div>
                    {lead.notes && (
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-muted-foreground text-[10px]" aria-hidden="true">
                          📝
                        </span>
                        <p className="line-clamp-3 text-muted-foreground">{lead.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t px-4 py-3">
                    {contact.type === "phone" ? (
                      <Button variant="outline" size="xs" asChild>
                        <a href={contact.href}>
                          <Phone className="mr-1 size-3" />
                          Call
                        </a>
                      </Button>
                    ) : contact.type === "email" ? (
                      <Button variant="outline" size="xs" asChild>
                        <a href={contact.href}>
                          <Mail className="mr-1 size-3" />
                          Email
                        </a>
                      </Button>
                    ) : contact.type === "web" ? (
                      <Button variant="outline" size="xs" asChild>
                        <a href={contact.href} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 size-3" />
                          Visit
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="xs" disabled>
                        <Phone className="mr-1 size-3" />
                        Call
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="xs"
                      onClick={() => handleAddToCrm(lead)}
                      disabled={isSaved || savingId === lead.business_name}
                    >
                      {savingId === lead.business_name ? (
                        <Loader2 className="mr-1 size-3 animate-spin" />
                      ) : isSaved ? (
                        <CheckCircle2 className="mr-1 size-3" />
                      ) : (
                        <ExternalLink className="mr-1 size-3" />
                      )}
                      {isSaved ? "In CRM" : "Add to CRM"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {result && leads.length === 0 && !loading && (
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
