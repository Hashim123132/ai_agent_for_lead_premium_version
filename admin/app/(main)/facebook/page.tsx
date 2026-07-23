"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fbSync,
  fbFetchPosts,
  fbAnalyze,
  fbFetchInsights,
  fbGenerateCaption,
  fbPublishPost,
} from "@/lib/api";
import type {
  FBPostAnalysis,
  FBPostSummary,
  FBInsightRecord,
} from "@/lib/api";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Lightbulb,
  Clock,
  ImageIcon,
  Send,
  Sparkles,
  Upload,
  ExternalLink,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  MousePointerClick,
  Loader2,
} from "lucide-react";

type PageTab = "dashboard" | "posts" | "create";

export default function FacebookPage() {
  const [tab, setTab] = useState<PageTab>("dashboard");
  const [analysis, setAnalysis] = useState<FBPostAnalysis | null>(null);
  const [insights, setInsights] = useState<FBInsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Create post state
  const [captionGoal, setCaptionGoal] = useState("");
  const [captionTone, setCaptionTone] = useState("Professional");
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagText, setHashtagText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsData, insightsData] = await Promise.all([
        fbFetchPosts(),
        fbFetchInsights(30),
      ]);
      setAnalysis(postsData);
      setInsights(insightsData.history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await fbSync();
      setSyncResult(`Synced ${result.new_posts} new posts`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await fbAnalyze();
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!captionGoal.trim()) return;
    setGeneratingCaption(true);
    try {
      const result = await fbGenerateCaption(captionGoal, captionTone);
      setGeneratedCaption(result.caption);
      setHashtags(result.hashtags);
      setHashtagText(result.hashtags.join(", "));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!generatedCaption.trim()) return;
    setPublishing(true);
    try {
      const fullMessage =
        generatedCaption + (hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "");
      const result = await fbPublishPost(fullMessage, imageFile || undefined);
      setPublishedId(result.post_id);
      setPublishError(null);
      setGeneratedCaption("");
      setHashtags([]);
      setHashtagText("");
      setImageFile(null);
      setImagePreview(null);
      setCaptionGoal("");
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  function formatDate(iso: string) {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function PostCard({
    post,
    rank,
    type,
  }: {
    post: FBPostSummary;
    rank?: number;
    type: "top" | "needs" | "recent";
  }) {
    const borderColor =
      type === "top"
        ? "border-green-200 dark:border-green-900"
        : type === "needs"
          ? "border-amber-200 dark:border-amber-900"
          : "border-border";
    return (
      <div className={`flex items-start gap-3 rounded-lg border p-3 ${borderColor}`}>
        {rank && (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm">
            {post.message || "(no caption)"}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {post.reach}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3" />
              {post.reactions}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              {post.comments}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="size-3" />
              {post.shares}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {post.engagement_rate}% er
            </Badge>
            {post.media_type !== "text" && (
              <Badge variant="secondary" className="text-[10px]">
                {post.media_type}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Clock className="size-3" />
            {formatDate(post.created_time)}
            {post.permalink_url && (
              <a
                href={post.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-primary hover:underline"
              >
                <ExternalLink className="size-3" />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /><Skeleton className="mt-1 h-3 w-20" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facebook Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Page insights, post performance, and AI-powered publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncResult && (
            <span className="text-xs text-green-600 dark:text-green-400">{syncResult}</span>
          )}
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1.5 size-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as PageTab)}>
        <TabsList>
          <TabsTrigger value="dashboard">Insights</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="create">Create Post</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------------- */}
        {/* INSIGHTS TAB */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="dashboard">
          <div className="flex flex-col gap-6">
            {/* Page overview cards */}
            {insights.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Followers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{insights[insights.length - 1]?.followers_count ?? "-"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Reach (30d)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {insights.reduce((s, r) => s + (r.page_impressions_unique || 0), 0).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analysis?.total_posts ?? "-"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Avg Engagement Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analysis?.averages?.avg_engagement_rate ?? "-"}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Performers */}
              {analysis?.top_performers && analysis.top_performers.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-green-600" />
                      <CardTitle className="text-base">Top Performers</CardTitle>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="space-y-3 pt-6">
                    {analysis.top_performers.slice(0, 5).map((p, i) => (
                      <PostCard key={p.post_id} post={p} rank={i + 1} type="top" />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Needs Improvement */}
              {analysis?.needs_improvement && analysis.needs_improvement.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="size-4 text-amber-600" />
                      <CardTitle className="text-base">Needs Improvement</CardTitle>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="space-y-3 pt-6">
                    {analysis.needs_improvement.slice(0, 5).map((p, i) => (
                      <PostCard key={p.post_id} post={p} rank={i + 1} type="needs" />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Recommendations */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-primary" />
                    <CardTitle className="text-base">AI Recommendations</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 size-3.5" />
                    )}
                    Analyze
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 pt-6">
                {analysis?.key_findings ? (
                  <>
                    <div>
                      <h4 className="mb-1 text-sm font-medium">Findings</h4>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {analysis.key_findings}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border p-3">
                        <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                          Best Posting Times
                        </h4>
                        <p className="text-sm">{analysis.best_posting_times}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                          Best Content Types
                        </h4>
                        <p className="text-sm">{analysis.best_content_types}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-1 text-sm font-medium">Recommendations</h4>
                      <ul className="space-y-1.5">
                        {(analysis.recommendations ?? []).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {analysis.trend_summary && (
                      <div>
                        <h4 className="mb-1 text-sm font-medium">Trend Summary</h4>
                        <p className="text-sm text-muted-foreground">{analysis.trend_summary}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
                    <BarChart3 className="size-5" />
                    Click &quot;Analyze&quot; to generate AI-powered recommendations based on your post data.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* POSTS TAB */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="posts">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {analysis?.total_posts ?? 0} posts synced
              </p>
            </div>

            {analysis?.recent_posts && analysis.recent_posts.length > 0 ? (
              <div className="space-y-3">
                {analysis.recent_posts.map((p, i) => (
                  <PostCard key={p.post_id || i} post={p} type="recent" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12">
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No posts synced yet. Click Sync to fetch posts from your page.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* CREATE POST TAB */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="create">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Write or Generate Caption</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Caption <span className="text-muted-foreground">(write your own or use AI below)</span>
                    </label>
                    <Textarea
                      placeholder="Type your caption here..."
                      value={generatedCaption}
                      onChange={(e) => setGeneratedCaption(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Separator />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      AI Assist — what is this post about?
                    </label>
                    <Textarea
                      placeholder="e.g. Promote weekend SUV rental deals with 20% discount"
                      value={captionGoal}
                      onChange={(e) => setCaptionGoal(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Tone</label>
                    <Select value={captionTone} onValueChange={setCaptionTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Casual">Casual / Friendly</SelectItem>
                        <SelectItem value="Luxury">Luxury / Premium</SelectItem>
                        <SelectItem value="Adventure">Adventure / Sporty</SelectItem>
                        <SelectItem value="Fun">Fun / Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleGenerateCaption}
                    disabled={generatingCaption || !captionGoal.trim()}
                    className="w-full"
                  >
                    {generatingCaption ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 size-4" />
                    )}
                    Generate with AI
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Upload Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {imageFile ? imageFile.name : "Click to upload an image"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WebP (max 10MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Preview</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="overflow-hidden rounded-lg border bg-card">
                    {imagePreview && (
                      <div className="aspect-[16/9] overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="size-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-3 p-4">
                      <label className="text-xs font-medium text-muted-foreground">
                        Caption <span className="font-normal">(edit freely)</span>
                      </label>
                      <Textarea
                        placeholder="Write your caption here..."
                        value={generatedCaption}
                        onChange={(e) => setGeneratedCaption(e.target.value)}
                        rows={4}
                        className="min-h-[80px]"
                      />
                      <label className="text-xs font-medium text-muted-foreground">
                        Hashtags <span className="font-normal">(comma-separated)</span>
                      </label>
                      <Input
                        placeholder="e.g. carrental, dubai, suv"
                        value={hashtagText}
                        onChange={(e) => {
                          setHashtagText(e.target.value);
                          setHashtags(
                            e.target.value
                              .split(",")
                              .map((h) => h.trim())
                              .filter(Boolean),
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={handlePublish}
                      disabled={publishing || !generatedCaption.trim()}
                      className="flex-1"
                    >
                      {publishing ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      {publishing ? "Publishing..." : "Publish to Facebook"}
                    </Button>
                  </div>

                  {publishedId && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CardContent className="flex items-center gap-3 py-4">
                        <Send className="size-5 shrink-0 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            Published successfully!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Post ID: {publishedId}. Check your Facebook Page to view it.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {publishError && (
                    <Card className="border-destructive">
                      <CardContent className="flex items-center gap-3 py-4">
                        <span className="text-sm text-destructive">{publishError}</span>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
