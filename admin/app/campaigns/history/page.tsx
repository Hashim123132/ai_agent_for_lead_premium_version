"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { approveCampaign, fetchCampaigns, rejectCampaign } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Filter,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

type CampaignRecord = {
  campaign_id: string;
  campaign_prompt: string;
  campaign_output: string;
  campaign_name: string;
  status: string;
  created_at: string;
  audience: string;
  suggested_offer: string;
  budget: string;
  expected_outcome: string;
  rationale: string;
  market_city: string;
  market_country: string;
};

function statusBadge(status: string) {
  switch (status) {
    case "Approved":
      return <Badge className="bg-green-600 hover:bg-green-600">Approved</Badge>;
    case "Rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "Approved":
      return <CheckCircle2 className="size-4 text-green-600" />;
    case "Rejected":
      return <XCircle className="size-4 text-red-600" />;
    default:
      return <Clock className="size-4 text-amber-500" />;
  }
}

function formatDate(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CampaignHistoryPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data.campaigns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(campaignId: string) {
    setActionLoading(campaignId);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.campaign_id === campaignId ? { ...c, status: "Approved" } : c,
      ),
    );
    try {
      await approveCampaign(campaignId);
    } catch {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaign_id === campaignId ? { ...c, status: "Draft" } : c,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(campaignId: string) {
    setActionLoading(campaignId);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.campaign_id === campaignId ? { ...c, status: "Rejected" } : c,
      ),
    );
    try {
      await rejectCampaign(campaignId);
    } catch {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaign_id === campaignId ? { ...c, status: "Draft" } : c,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (filterCountry && c.market_country?.toLowerCase() !== filterCountry.toLowerCase()) return false;
      if (filterCity && c.market_city?.toLowerCase() !== filterCity.toLowerCase()) return false;
      return true;
    });
  }, [campaigns, filterCountry, filterCity]);

  const uniqueCountries = useMemo(
    () => [...new Set(campaigns.map((c) => c.market_country).filter(Boolean))],
    [campaigns],
  );

  const uniqueCities = useMemo(
    () => [...new Set(campaigns.map((c) => c.market_city).filter(Boolean))],
    [campaigns],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading campaign history…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Campaign History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All previously generated campaigns and their review status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Filter by Location</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Country
              </label>
              <input
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
                placeholder="Any country"
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                list="country-list"
              />
              <datalist id="country-list">
                {uniqueCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                City
              </label>
              <input
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
                placeholder="Any city"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                list="city-list"
              />
              <datalist id="city-list">
                {uniqueCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {(filterCountry || filterCity) && (
              <div className="flex items-end">
                <button
                  className="flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setFilterCountry("");
                    setFilterCity("");
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <Clock className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {campaigns.length === 0
                ? "No campaigns generated yet."
                : "No campaigns match the selected filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {campaigns.length} campaigns
          </p>
          {filtered.map((c) => (
            <Card
              key={c.campaign_id}
              className="cursor-pointer transition-colors hover:border-muted-foreground/20"
              onClick={() =>
                setExpandedId(expandedId === c.campaign_id ? null : c.campaign_id)
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(c.status)}
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {c.campaign_name || "Campaign"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(c.created_at)}</span>
                        {(c.market_city || c.market_country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {[c.market_city, c.market_country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {statusBadge(c.status)}
                </div>
              </CardHeader>

              {expandedId === c.campaign_id && (
                <CardContent className="space-y-4 pt-0">
                  <Separator />
                  {c.campaign_prompt && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Original Prompt
                      </p>
                      <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                        {c.campaign_prompt}
                      </p>
                    </div>
                  )}
                  {c.campaign_output && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        Generated Campaign
                      </p>
                      <div className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed">
                        {c.campaign_output}
                      </div>
                    </div>
                  )}
                  {(c.suggested_offer || c.budget || c.expected_outcome) && (
                    <div className="grid grid-cols-3 gap-3">
                      {c.suggested_offer && (
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Offer</p>
                          <p className="text-sm font-medium">{c.suggested_offer}</p>
                        </div>
                      )}
                      {c.budget && (
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium">{c.budget}</p>
                        </div>
                      )}
                      {c.expected_outcome && (
                        <div className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            Expected Outcome
                          </p>
                          <p className="text-sm font-medium">{c.expected_outcome}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <>
                    <Separator />
                    <div className="flex items-center justify-end gap-2">
                      {c.status !== "Rejected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(c.campaign_id);
                          }}
                          disabled={actionLoading === c.campaign_id}
                        >
                          {actionLoading === c.campaign_id ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <ThumbsDown className="mr-1 size-3.5" />
                          )}
                          Reject
                        </Button>
                      )}
                      {c.status !== "Approved" && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(c.campaign_id);
                          }}
                          disabled={actionLoading === c.campaign_id}
                        >
                          {actionLoading === c.campaign_id ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <ThumbsUp className="mr-1 size-3.5" />
                          )}
                          Approve
                        </Button>
                      )}
                    </div>
                  </>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
