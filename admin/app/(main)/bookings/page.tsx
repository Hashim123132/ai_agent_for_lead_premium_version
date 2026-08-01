"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { fetchBookings, type BookingRecord } from "@/lib/api";
import { CalendarDays, Car, ExternalLink, HelpCircle, RefreshCw } from "lucide-react";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1aLY2RP28WSJdB7cxBAcpB0rfGStObAwd8_Vz8zkNBvI/edit?gid=1907655293#gid=1907655293";

const FACEBOOK_PAGE_URL =
  "https://www.facebook.com/profile.php?id=61590083712603";

const COLUMNS: { key: string; label: string; aliases: string[] }[] = [
  { key: "customer_name", label: "Customer", aliases: ["customer_name", "customer name", "name", "full name"] },
  { key: "phone", label: "Phone", aliases: ["phone", "phone number"] },
  { key: "email", label: "Email", aliases: ["email", "email address"] },
  { key: "car", label: "Car", aliases: ["car", "car name", "vehicle"] },
  { key: "pickup_location", label: "Pickup Location", aliases: ["pickup_location", "pickup location", "location"] },
  { key: "pickup_time", label: "Pickup Time", aliases: ["pickup_time", "pickup time", "pickup date"] },
  { key: "return_time", label: "Return Time", aliases: ["return_time", "return time", "return date"] },
  { key: "booking_date", label: "Booked At", aliases: ["booking_date", "booking date", "booked at", "date"] },
];

function columnKeys(record: BookingRecord): Set<string> {
  return new Set(
    Object.keys(record).map((k) => k.replace(/\s+/g, "_").toLowerCase()),
  );
}

function pickColumnValue(record: BookingRecord, aliases: string[]): string | null {
  const keys = columnKeys(record);
  for (const alias of aliases) {
    const normalized = alias.replace(/\s+/g, "_").toLowerCase();
    if (keys.has(normalized)) return String(record[Object.keys(record).find((k) => k.replace(/\s+/g, "_").toLowerCase() === normalized)!] ?? "");
  }
  return null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBookings();
      setBookings(res.bookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchBookings();
        if (cancelled) return;
        setBookings(res.bookings ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleColumns = bookings.length > 0
    ? COLUMNS.filter((col) => pickColumnValue(bookings[0], col.aliases) !== null)
    : COLUMNS;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All bookings recorded from the Bookings tab of your Google Sheet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && !error && (
            <Badge variant="secondary">{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</Badge>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5"
              >
                <HelpCircle className="size-3.5" />
                How bookings work
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>How bookings come in</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <div>
                    <p className="font-medium text-foreground">1. Customer messages your Facebook page</p>
                    <p>
                      Customers go to your page on Facebook Messenger and ask for a car — for
                      example, &ldquo;Is a Corolla available tomorrow?&rdquo;
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">2. The AI answers and takes the booking</p>
                    <p>
                      The AI replies right away, checks car availability, and saves the booking
                      details (name, phone, car, pickup times) to your Google Sheet.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">3. It appears here after you refresh</p>
                    <p>
                      Click the <span className="font-medium text-foreground">Refresh</span> button
                      and any new booking will show up in the table below.
                    </p>
                  </div>
                  <a
                    href={FACEBOOK_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    Open the Facebook page
                  </a>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <ExternalLink className="size-3.5" />
            See in Sheets
          </a>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            Booking Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="p-6 text-sm text-destructive">{error}</p>
          ) : bookings.length === 0 ? (
            <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Car className="size-4" />
              No bookings found yet. Bookings made through the Booking Agent will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    {visibleColumns.map((col) => (
                      <th key={col.key} className="px-4 py-3 font-medium">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-foreground/5">
                      {visibleColumns.map((col) => {
                        const value = pickColumnValue(booking, col.aliases);
                        return (
                          <td key={col.key} className="whitespace-nowrap px-4 py-3">
                            {value || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
