"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  generateCampaignStream,
  approveCampaign,
  rejectCampaign,
  fetchActiveCampaign,
  fetchBusinessProfile,
} from "@/lib/api";
import { Combobox } from "@/components/ui/combobox";
import {
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Clock,
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

type CampaignCard = {
  id: string;
  campaignId: string;
  prompt: string;
  content: string;
  status: string;
};

const PROGRESS_STEPS = [
  "Fetching booking data...",
  "Analyzing relevant ads...",
  "Analyzing market trends...",
  "Extracting and validating evidence...",
  "Generating campaign strategy...",
  "Finalizing campaign draft...",
];

export default function CampaignsPage() {
  const [prompt, setPrompt] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingApprove, setPendingApprove] = useState<string | null>(null);
  const [activeCampaignName, setActiveCampaignName] = useState<string | null>(null);
  const [approveWarning, setApproveWarning] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const lastCampaignId =
    campaigns.length > 0 ? campaigns[0].campaignId : null;

  useEffect(() => {
    if (lastCampaignId && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [lastCampaignId]);

  useEffect(() => {
    fetchBusinessProfile().then((res) => {
      if (res.profile) {
        if (!city && res.profile.city) setCity(res.profile.city);
        if (!country && res.profile.country) setCountry(res.profile.country);
      }
    }).catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setProgressMsg(PROGRESS_STEPS[0]);

    try {
      const result = await generateCampaignStream(
        prompt,
        { country, city },
        (msg) => {
          setProgressMsg(msg);
        },
      );

      setCampaigns((prev) => [
        {
          id: crypto.randomUUID(),
          campaignId: result.campaign_id,
          prompt,
          content: result.response,
          status: "Draft",
        },
        ...prev,
      ]);
      setPrompt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setProgressMsg("");
    }
  }

  async function handleApproveClick(campaignId: string) {
    setApproveWarning(null);
    try {
      const data = await fetchActiveCampaign();
      if (data.campaign) {
        const name = data.campaign.campaign_name || data.campaign.campaign_id;
        setActiveCampaignName(name);
        setPendingApprove(campaignId);
      } else {
        await doApprove(campaignId);
      }
    } catch {
      await doApprove(campaignId);
    }
  }

  async function doApprove(campaignId: string) {
    setActionLoading(campaignId);
    setCampaigns((prev) =>
      prev.map((c) =>
        c.campaignId === campaignId ? { ...c, status: "Approved" } : c,
      ),
    );
    try {
      const result = await approveCampaign(campaignId);
      if (result.warning) {
        setApproveWarning(result.warning);
      }
    } catch {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaignId === campaignId ? { ...c, status: "Draft" } : c,
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
        c.campaignId === campaignId ? { ...c, status: "Rejected" } : c,
      ),
    );
    try {
      await rejectCampaign(campaignId);
    } catch {
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaignId === campaignId ? { ...c, status: "Draft" } : c,
        ),
      );
    } finally {
      setActionLoading(null);
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

  function statusBadge(status: string) {
    switch (status) {
      case "Approved":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600">Approved</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6">
      <AlertDialog
        open={pendingApprove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingApprove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Campaign Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Another campaign is currently active. Approving this one will
              deactivate the previous campaign (<span className="font-medium text-foreground">{activeCampaignName}</span>).
              Only one campaign can be active at a time.
              <br /><br />
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = pendingApprove;
                setPendingApprove(null);
                if (id) doApprove(id);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Campaign Generator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your campaign goals and let AI generate tailored
          recommendations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Campaign Request</CardTitle>
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
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          <Textarea
            placeholder="e.g. Create a summer promotion targeting families with a 15% discount on SUV rentals..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            rows={4}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="justify-between">
          <p className="text-xs text-muted-foreground">
            The agent will analyze booking data, relevant ads, and market
            trends{country || city ? ` for ${[city, country].filter(Boolean).join(", ")}` : ""}.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 size-4" />
                Generate Campaign Ideas
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
              <p className="text-sm font-medium">Working on your campaign</p>
              <p className="text-xs text-muted-foreground">{progressMsg}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.length > 0 && !loading && (
        <div ref={resultRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Campaign Results</h2>
            <Badge variant="secondary">{campaigns.length}</Badge>
          </div>
          <Separator />

          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className={
                campaign.campaignId === lastCampaignId
                  ? "ring-2 ring-primary/20"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Generated Campaign
                    </CardTitle>
                    {statusBadge(campaign.status)}
                  </div>
                  {statusIcon(campaign.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {campaign.content}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="flex flex-col gap-2">
                {campaign.campaignId === pendingApprove && (
                  <p className="text-xs text-amber-600">
                    Checking for active campaign…
                  </p>
                )}
                {approveWarning && (
                  <p className="text-xs text-amber-600">{approveWarning}</p>
                )}
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Status: {campaign.status}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(campaign.campaignId)}
                      disabled={
                        campaign.status !== "Draft" ||
                        actionLoading === campaign.campaignId
                      }
                    >
                      {actionLoading === campaign.campaignId ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <ThumbsDown className="mr-1 size-3.5" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveClick(campaign.campaignId)}
                      disabled={
                        campaign.status !== "Draft" ||
                        actionLoading === campaign.campaignId
                      }
                    >
                      {actionLoading === campaign.campaignId ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <ThumbsUp className="mr-1 size-3.5" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
