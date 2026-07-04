"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { fetchBusinessProfile, updateBusinessProfile } from "@/lib/api";
import type { BusinessProfile } from "@/lib/api";
import { Loader2, Save, AlertCircle, CheckCircle2, Store, MapPin, Car, DollarSign, Palette, Users, Megaphone, Target } from "lucide-react";

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

const FLEET_OPTIONS = [
  { label: "SUVs", value: "SUVs" },
  { label: "Sedans", value: "Sedans" },
  { label: "Luxury", value: "Luxury" },
  { label: "Economy", value: "Economy" },
  { label: "Vans / Minivans", value: "Vans" },
  { label: "Sports Cars", value: "Sports Cars" },
  { label: "Electric / Hybrid", value: "Electric, Hybrid" },
  { label: "Trucks", value: "Trucks" },
];

const TONE_OPTIONS = [
  { label: "Premium / Luxury", value: "Premium" },
  { label: "Affordable / Budget", value: "Affordable" },
  { label: "Family-Friendly", value: "Family-Friendly" },
  { label: "Professional / Corporate", value: "Professional" },
  { label: "Adventure / Sporty", value: "Adventure" },
  { label: "Eco / Green", value: "Eco-Friendly" },
  { label: "Fun / Casual", value: "Casual" },
];

const MARKET_OPTIONS = [
  { label: "Tourists", value: "Tourists" },
  { label: "Business Travelers", value: "Business travelers" },
  { label: "Locals / Residents", value: "Locals" },
  { label: "Corporate Clients", value: "Corporate clients" },
  { label: "Luxury Clients", value: "Luxury clients" },
  { label: "Budget Travelers", value: "Budget travelers" },
  { label: "Families", value: "Families" },
];

const CHANNEL_OPTIONS = [
  { label: "Meta (Facebook / Instagram)", value: "Meta" },
  { label: "Google Ads", value: "Google Ads" },
  { label: "TikTok", value: "TikTok" },
  { label: "Snapchat", value: "Snapchat" },
  { label: "LinkedIn", value: "LinkedIn" },
  { label: "Pinterest", value: "Pinterest" },
  { label: "YouTube", value: "YouTube" },
  { label: "Email Marketing", value: "Email" },
  { label: "SEO / Organic", value: "SEO" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchBusinessProfile()
      .then((res) => {
        setProfile(res.profile);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  function update(field: keyof BusinessProfile, value: string) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setSaved(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateBusinessProfile(profile);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is injected into AI prompts to personalize campaign generation and ad analysis.
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="size-4" />
              Business Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Business Name</label>
              <Input
                placeholder="e.g. Hashim Car Rentals"
                value={profile?.business_name ?? ""}
                onChange={(e) => update("business_name", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="size-3.5" />
                City
              </label>
              <Combobox
                value={profile?.city ?? ""}
                onChange={(v) => update("city", v)}
                options={[
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
                ]}
                placeholder="Select or type city..."
                searchPlaceholder="Search city..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Country</label>
              <Combobox
                value={profile?.country ?? ""}
                onChange={(v) => update("country", v)}
                options={COUNTRIES}
                placeholder="Select or type country..."
                searchPlaceholder="Search country..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="size-4" />
              Fleet & Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fleet Types</label>
              <Combobox
                value={profile?.fleet_types ?? ""}
                onChange={(v) => update("fleet_types", v)}
                options={FLEET_OPTIONS}
                placeholder="Select or type fleet type..."
                searchPlaceholder="Search fleet..."
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <DollarSign className="size-3.5" />
                Budget Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Min"
                  value={profile?.budget_min ?? ""}
                  onChange={(e) => update("budget_min", e.target.value)}
                />
                <Input
                  placeholder="Max"
                  value={profile?.budget_max ?? ""}
                  onChange={(e) => update("budget_max", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4" />
              Brand & Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Brand Tone</label>
              <Combobox
                value={profile?.brand_tone ?? ""}
                onChange={(v) => update("brand_tone", v)}
                options={TONE_OPTIONS}
                placeholder="Select or type tone..."
                searchPlaceholder="Search tone..."
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-3.5" />
                Target Market
              </label>
              <Combobox
                value={profile?.target_market ?? ""}
                onChange={(v) => update("target_market", v)}
                options={MARKET_OPTIONS}
                placeholder="Select or type market..."
                searchPlaceholder="Search market..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                <Megaphone className="size-3.5" />
                Preferred Marketing Channels
              </label>
              <Combobox
                value={profile?.preferred_channels ?? ""}
                onChange={(v) => update("preferred_channels", v)}
                options={CHANNEL_OPTIONS}
                placeholder="Select or type channel..."
                searchPlaceholder="Search channel..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4" />
              Business Goals
            </CardTitle>
            <CardDescription>
              These goals pre-fill the &quot;Goal&quot; field in Ad Suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Increase bookings by 20%, promote SUVs, improve occupancy rate"
              value={profile?.business_goals ?? ""}
              onChange={(e) => update("business_goals", e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Settings
            </>
          )}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
