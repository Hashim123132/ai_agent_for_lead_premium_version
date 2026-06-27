"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchMetrics } from "@/lib/api";
import {
  Loader2,
  Car,
  CalendarCheck,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";

type MetricsData = {
  totalCars: number;
  availableCars: number;
  occupancyRate: number;
  totalBookings: number;
  recentBookings: number;
  popularCars: Array<{ name: string; count: number }>;
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { direction: "up" | "down"; label: string };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp
              className={`size-3 ${
                trend.direction === "up" ? "text-green-600" : "text-red-600"
              }`}
            />
            <span
              className={`text-xs ${
                trend.direction === "up"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetrics();
      setMetrics(data.metrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Loading business metrics…</p>
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

  if (!metrics) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Business health overview at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Cars"
          value={metrics.totalCars}
          subtitle={`${metrics.availableCars} available`}
          icon={Car}
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${metrics.occupancyRate}%`}
          subtitle={`${metrics.totalCars - metrics.availableCars} of ${metrics.totalCars} cars booked`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Bookings"
          value={metrics.totalBookings}
          icon={CalendarCheck}
        />
        <MetricCard
          title="Bookings (30d)"
          value={metrics.recentBookings}
          subtitle="Last 30 days"
          icon={Users}
        />
      </div>

      {metrics.popularCars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Popular Cars</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-4">
              {metrics.popularCars.map((car, idx) => (
                <div key={car.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{car.name}</span>
                  </div>
                  <Badge variant="secondary">{car.count} bookings</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
