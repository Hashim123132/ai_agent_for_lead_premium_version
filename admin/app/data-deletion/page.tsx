import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Data Deletion Request | FleetOps",
  description:
    "Request deletion of your data collected through the FleetOps application, including Facebook-related data.",
};

/*
 * This page satisfies the Facebook/Meta Platform "Data Deletion" requirement for apps that
 * store user data (messages, page insights, leads, etc.).
 *
 * NOTE FOR REVIEW: the page below is currently informational. Requests received by email are
 * handled manually for now. A production implementation should add a backend endpoint that
 * actually erases the user's data (Google Sheets rows, backend storage) upon verified request,
 * and this page should link to it.
 * LEGAL REVIEW REQUIRED: confirm the data categories listed match what the application stores.
 * This document is informational and does not constitute legal advice.
 */

const CONTACT_EMAIL = "hashimumarsyed2005@gmail.com";
const COMPANY_NAME = "Fleetops";
const LAST_UPDATED = "August 1, 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">User Data Deletion Request</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {LAST_UPDATED}
        </p>

        {/* Request Data Deletion */}
        <Section id="request" title="Request Data Deletion">
          <Paragraph>
            If you want us to delete your data collected through our application, you can
            request deletion by contacting us at {CONTACT_EMAIL}.
          </Paragraph>
          <Paragraph>To request deletion, please provide:</Paragraph>
          <List
            items={[
              "Your name",
              "Email address",
              "Facebook account/page details (if applicable)",
              "Any relevant information to identify your data",
            ]}
          />
        </Section>

        {/* What We Delete */}
        <Section id="what-we-delete" title="What We Delete">
          <Paragraph>After verifying your request, we will delete or remove:</Paragraph>
          <List
            items={[
              "Personal information stored by our application",
              "Customer conversation data",
              "Lead information associated with your account",
              "Facebook-related data collected through our integrations",
            ]}
          />
        </Section>

        {/* Processing Time */}
        <Section id="processing-time" title="Processing Time">
          <Paragraph>
            We will process valid deletion requests within a reasonable timeframe and notify
            you once the deletion is completed.
          </Paragraph>
        </Section>

        {/* Contact */}
        <Section id="contact" title="Contact">
          <Paragraph>
            For data deletion requests, contact: {CONTACT_EMAIL}
          </Paragraph>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
