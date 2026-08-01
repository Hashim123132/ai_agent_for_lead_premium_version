const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BusinessProfile {
  business_name: string;
  city: string;
  country: string;
  fleet_types: string;
  budget_min: string;
  budget_max: string;
  brand_tone: string;
  target_market: string;
  preferred_channels: string;
  business_goals: string;
}

export interface Lead {
  business_name: string;
  lead_type: string;
  contact_info: string;
  status: string;
  notes: string;
  score: number;
  source?: string;
  city?: string;
  country?: string;
  outreach_draft?: string;
}

function parseResponse<T>(data: { status: string } & T): T {
  if (data.status === "error") throw new Error((data as any).error || "Unknown error");
  const { status: _, ...rest } = data as any;
  return rest as T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return parseResponse<T>(data);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface MetricsData {
  totalCars: number;
  availableCars: number;
  occupancyRate: number;
  totalBookings: number;
  recentBookings: number;
  popularCars: Array<{ name: string; count: number }>;
}

export async function fetchMetrics(): Promise<{ metrics: MetricsData }> {
  const res = await fetch(`${API_BASE_URL}/metrics`);
  return handleResponse<{ metrics: MetricsData }>(res);
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export interface CampaignRecord {
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
  result_score?: string;
  baseline_metrics_json?: string;
  evaluated_at?: string;
}

export async function fetchCampaigns(): Promise<{ campaigns: CampaignRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/campaigns`);
  return handleResponse<{ campaigns: CampaignRecord[] }>(res);
}

export async function fetchActiveCampaign(): Promise<{
  campaign: (CampaignRecord & { is_active?: string; approved_at?: string; evaluation_window_days?: string }) | null;
}> {
  const res = await fetch(`${API_BASE_URL}/campaign/active`);
  return handleResponse<{ campaign: any | null }>(res);
}

export async function approveCampaign(
  campaignId: string,
): Promise<{ warning?: string }> {
  const res = await fetch(`${API_BASE_URL}/campaign/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId }),
  });
  return handleResponse<{ warning?: string }>(res);
}

export async function rejectCampaign(campaignId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/campaign/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId }),
  });
  await handleResponse<Record<string, never>>(res);
}

export async function evaluateCampaign(
  campaignId: string,
): Promise<{
  status: "ok" | "error";
  campaign_id?: string;
  baseline?: any;
  current?: any;
  impact?: any;
  score?: number;
  evaluated_at?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/campaign/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId }),
  });
  const data = await res.json();
  return data as any;
}

// ---------------------------------------------------------------------------
// Business Profile
// ---------------------------------------------------------------------------

export async function fetchBusinessProfile(): Promise<{
  profile: BusinessProfile;
}> {
  const res = await fetch(`${API_BASE_URL}/business-profile`);
  return handleResponse<{ profile: BusinessProfile }>(res);
}

export async function updateBusinessProfile(
  profile: BusinessProfile,
): Promise<{ profile: BusinessProfile }> {
  const res = await fetch(`${API_BASE_URL}/business-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return handleResponse<{ profile: BusinessProfile }>(res);
}

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

async function readSSEStream(
  response: Response,
  onProgress?: (msg: string) => void,
  onLead?: (lead: Lead) => void,
  onLeads?: (leads: Lead[]) => void,
  signal?: AbortSignal,
): Promise<{ response: string; campaign_id?: string }> {
  if (!response.body) throw new Error("Response body is null");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: { response: string; campaign_id?: string } | null = null;

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const payload = JSON.parse(trimmed.slice(6));

        if (payload.type === "progress" && onProgress) {
          onProgress(payload.message);
        } else if (payload.type === "result") {
          result = payload;
        } else if (payload.type === "error") {
          throw new Error(payload.error || "SSE error");
        } else if (payload.type === "lead" && onLead) {
          onLead(payload.lead);
        } else if (payload.type === "leads" && onLeads) {
          onLeads(payload.leads);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  if (!result) throw new Error("Stream ended without a result");
  return result;
}

async function readSSEStreamText(
  response: Response,
  onProgress?: (msg: string) => void,
  onLead?: (lead: Lead) => void,
  onLeads?: (leads: Lead[]) => void,
  signal?: AbortSignal,
): Promise<string> {
  const result = await readSSEStream(response, onProgress, onLead, onLeads, signal);
  return result.response;
}

// ---------------------------------------------------------------------------
// Marketing (Campaign Generation) - SSE
// ---------------------------------------------------------------------------

export async function generateCampaignStream(
  prompt: string,
  market: { country: string; city: string },
  onProgress: (msg: string) => void,
): Promise<{ campaign_id: string; response: string }> {
  const res = await fetch(`${API_BASE_URL}/marketing/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, market }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const result = await readSSEStream(res, onProgress);
  return { campaign_id: result.campaign_id || "", response: result.response };
}

// ---------------------------------------------------------------------------
// Leads Generation - SSE
// ---------------------------------------------------------------------------

export async function generateLeadsStream(
  query: string,
  city: string,
  country: string,
  onProgress: (msg: string) => void,
  onLead?: (lead: Lead) => void,
  onLeads?: (leads: Lead[]) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/leads/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, market: { city, country } }),
    signal,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return readSSEStreamText(res, onProgress, onLead, onLeads, signal);
}

export async function saveLead(
  lead: Partial<Lead>,
): Promise<{ business_name: string }> {
  const res = await fetch(`${API_BASE_URL}/leads/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error || "Failed to save lead");
  return data;
}

// ---------------------------------------------------------------------------
// Pricing Recommendation - SSE
// ---------------------------------------------------------------------------

export async function generatePricingRecommendation(
  city: string,
  country: string,
  onProgress: (msg: string) => void,
  focus?: string,
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/pricing/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ market: { city, country }, focus }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return readSSEStreamText(res, onProgress);
}

// ---------------------------------------------------------------------------
// Facebook Page Insights & Posting
// ---------------------------------------------------------------------------

export interface FBPostSummary {
  post_id: string;
  message: string;
  created_time: string;
  permalink_url: string;
  media_type: string;
  reach: number;
  impressions: number;
  engagement: number;
  engagement_rate: number;
  reactions: number;
  comments: number;
  shares: number;
}

export interface FBPostAnalysis {
  total_posts?: number;
  best_posting_times?: string;
  best_content_types?: string;
  key_findings?: string;
  recommendations?: string[];
  trend_summary?: string;
  top_performers: FBPostSummary[];
  needs_improvement: FBPostSummary[];
  recent_posts: FBPostSummary[];
  averages: {
    avg_reach: number;
    avg_impressions: number;
    avg_engagement: number;
    avg_engagement_rate: number;
  };
  media_performance?: Record<string, { avg_engagement: number; count: number; avg_er: number }>;
}

export interface FBInsightRecord {
  date: string;
  followers_count: number;
  page_fan_adds: number;
  page_fan_removes: number;
  page_impressions: number;
  page_impressions_unique: number;
  page_engaged_users: number;
  page_views_total: number;
}

export async function fbSync(): Promise<{ new_posts: number; insights: Record<string, number> }> {
  const res = await fetch(`${API_BASE_URL}/facebook/sync`, { method: "POST" });
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data;
}

export async function fbFetchPosts(): Promise<FBPostAnalysis> {
  const res = await fetch(`${API_BASE_URL}/facebook/posts`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data as FBPostAnalysis;
}

export async function fbFetchInsights(days = 30): Promise<{ history: FBInsightRecord[] }> {
  const res = await fetch(`${API_BASE_URL}/facebook/insights?days=${days}`);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data;
}

export async function fbAnalyze(): Promise<FBPostAnalysis> {
  const res = await fetch(`${API_BASE_URL}/facebook/analyze`, { method: "POST" });
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data as FBPostAnalysis;
}

export async function fbGenerateCaption(goal: string, tone: string): Promise<{ caption: string; hashtags: string[] }> {
  const res = await fetch(`${API_BASE_URL}/facebook/generate-caption`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal, tone }),
  });
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data;
}

export async function fbPublishPost(message: string, imageFile?: File): Promise<{ post_id: string }> {
  const form = new FormData();
  form.append("message", message);
  if (imageFile) form.append("image", imageFile);
  const res = await fetch(`${API_BASE_URL}/facebook/publish`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (data.status === "error") throw new Error(data.error);
  return data;
}
