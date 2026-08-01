import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | FleetOps",
  description:
    "Privacy policy for FleetOps — how we collect, use, and protect your personal data.",
};

/*
 * LEGAL REVIEW REQUIRED (all flagged clauses below):
 * - Section 4 (Legal Basis): verify Article 6 GDPR bases match each processing activity.
 * - Section 6 (International Transfers): confirm SCCs/adequacy decisions for Meta, Google,
 *   Render (US) and LLM providers; consider a Data Processing Agreement with each processor.
 * - Section 7 (Retention): confirm retention periods comply with local law.
 * - Section 9 (Cookies): confirm whether any cookies require consent under ePrivacy/GDPR.
 * - Section 11 (Children): service is not directed at children, but verify age verification.
 * - Section 14 (Governing Law): company is based in Lahore, Pakistan; confirm governing law
 *   clause and EU territorial scope with counsel.
 * This document is informational and does not constitute legal advice.
 */

const CONTACT_EMAIL = "hashimumarsyed2005@gmail.com";
const COMPANY_NAME = "Fleetops";
const COMPANY_ADDRESS = "Gajjumat Lahore";
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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {LAST_UPDATED}
        </p>

        {/* Preamble */}
        <Section id="preamble" title="Introduction">
          <Paragraph>
            This Privacy Policy explains how {COMPANY_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), based at{" "}
            {COMPANY_ADDRESS}, collects, uses, stores, and protects your personal data when you use
            our AI-powered fleet booking service (the &ldquo;Service&rdquo;), including bookings made through
            Facebook Messenger and the booking management tools we operate.
          </Paragraph>
          <Paragraph>
            We respect your privacy and are committed to protecting your personal data. This policy
            describes the types of data we collect, why we collect it, how it is shared, and the
            rights you have under the EU General Data Protection Regulation (GDPR) and applicable
            data protection laws.
          </Paragraph>
          <Paragraph>
            If you have any questions about this policy, contact us at {CONTACT_EMAIL}.
          </Paragraph>
        </Section>

        {/* Quick summary */}
        <div className="rounded-lg border border-border bg-muted/40 p-5 mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-3">Quick Summary</h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
            <li>
              <strong className="text-foreground">What we collect:</strong> your name, phone
              number, email, booking details (car, pickup location, pickup/return times), and
              Facebook Messenger conversations.
            </li>
            <li>
              <strong className="text-foreground">Why:</strong> to manage your car rental booking
              from start to finish, send confirmations and follow-ups, and improve our service.
            </li>
            <li>
              <strong className="text-foreground">Who we share with:</strong> Meta (Messenger),
              Google (Sheets/Cloud), our hosting provider Render, and AI service providers.
              We never sell your data.
            </li>
            <li>
              <strong className="text-foreground">Your rights:</strong> access, correction,
              deletion, restriction, portability, and objection — contact {CONTACT_EMAIL}.
            </li>
            <li>
              <strong className="text-foreground">Retention:</strong> bookings kept for 2 years
              after your last booking; conversations for 90 days; logs for 30 days.
            </li>
          </ul>
        </div>

        {/* 1. Information We Collect */}
        <Section id="collect" title="1. Information We Collect">
          <Paragraph>We collect the following categories of personal data:</Paragraph>
          <List
            items={[
              "Contact details: your name, phone number, and email address.",
              "Booking details: the car you choose, pickup location, pickup time, and return time.",
              "Conversation data: messages you send us through Facebook Messenger, including any details you share about your rental needs.",
              "Usage data: how you interact with our Service, such as which pages you visit and which features you use.",
              "Device information: your device type, operating system, browser, and IP address.",
            ]}
          />
          <Paragraph>
            We do not intentionally collect sensitive or special-category data (such as health,
            biometric, or religious data), and we do not knowingly collect data from children
            under 16.
          </Paragraph>
        </Section>

        {/* 2. How We Collect Information */}
        <Section id="how-collect" title="2. How We Collect Information">
          <List
            items={[
              "Directly from you: when you message us on Facebook Messenger with booking requests or provide your details to complete a reservation.",
              "Automatically: when you use our Service, we log basic technical information such as your IP address, device type, and pages viewed.",
              "From third parties: we receive message content from Meta when you contact us via Facebook Messenger.",
            ]}
          />
        </Section>

        {/* 3. How We Use Information */}
        <Section id="use" title="3. How We Use Information">
          <Paragraph>We use your personal data for the following purposes:</Paragraph>
          <List
            items={[
              "Providing the Service: processing bookings, checking car availability, sending booking confirmations, and following up on incomplete bookings.",
              "Customer support: responding to your questions and resolving issues.",
              "Security and fraud prevention: protecting our Service and customers from abuse or fraudulent bookings.",
              "Service improvement: analyzing usage patterns to identify confusing or broken flows and improve the booking experience.",
              "Legal compliance: meeting our obligations under applicable laws and regulations.",
            ]}
          />
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm no additional purposes (e.g., marketing) exist; if
            marketing is added, update this section and obtain consent where required. */}
            We do not use your data for advertising or marketing purposes without your consent.
          </Paragraph>
        </Section>

        {/* 4. Legal Basis for Processing */}
        <Section id="legal-basis" title="4. Legal Basis for Processing (GDPR)">
          <Paragraph>
            Under the GDPR, we process your personal data on the following legal bases:
          </Paragraph>
          <List
            items={[
              "Performance of a contract (Article 6(1)(b)): processing your booking and providing the Service you requested.",
              "Legitimate interests (Article 6(1)(f)): improving our Service, preventing fraud, and following up on incomplete bookings where this does not override your rights.",
              "Legal obligation (Article 6(1)(c)): where the law requires us to keep records or share information with authorities.",
            ]}
          />
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: verify each processing activity maps to the correct legal
            basis and document it in the record of processing activities (Art. 30 GDPR). */}
            Where we rely on consent for any processing, we will ask for it separately and clearly,
            and you may withdraw it at any time.
          </Paragraph>
        </Section>

        {/* 5. Data Sharing and Third Parties */}
        <Section id="sharing" title="5. Data Sharing and Third Parties">
          <Paragraph>We share your data only with the following categories of recipients:</Paragraph>
          <List
            items={[
              "Meta Platforms: to deliver and receive Facebook Messenger messages.",
              "Google: to store booking and car inventory data in Google Sheets and use Google Cloud services.",
              "AI and search providers (OpenAI, Groq, Mistral, Google AI, Tavily): to power the conversational booking assistant and market research.",
              "Composio and Bland.ai: for calendar/Gmail tooling and outbound confirmation calls.",
              "Render: our hosting provider, which processes data on our servers.",
              "Legal authorities: only where required by law or to protect our legal rights.",
            ]}
          />
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: each processor must have a Data Processing Agreement (DPA)
            in place; confirm with the third parties listed above. */}
            We never sell your personal data to third parties.
          </Paragraph>
        </Section>

        {/* 6. International Data Transfer */}
        <Section id="transfers" title="6. International Data Transfers">
          <Paragraph>
            Your data is processed on servers located outside the EU, including the United States,
            by our hosting provider (Render) and the third parties listed above (Meta, Google,
            OpenAI, and others).
          </Paragraph>
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm which transfer mechanism applies (e.g., adequacy
            decisions, Standard Contractual Clauses, or explicit consent) for each recipient. */}
            Where your data is transferred outside the European Economic Area, we rely on
            appropriate safeguards such as the European Commission&rsquo;s Standard Contractual Clauses,
            or on adequacy decisions where applicable, to ensure your data remains protected.
          </Paragraph>
        </Section>

        {/* 7. Data Retention */}
        <Section id="retention" title="7. Data Retention">
          <Paragraph>We keep your personal data only as long as necessary:</Paragraph>
          <List
            items={[
              "Booking records: 2 years after your last booking.",
              "Messenger conversation data: 90 days after the conversation ends.",
              "Usage and technical logs: 30 days.",
              "Records we are legally required to keep: for the period required by law.",
            ]}
          />
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm retention periods comply with local and EU law; be
            specific in your internal retention schedule. */}
            When data is no longer needed, we delete or anonymize it securely.
          </Paragraph>
        </Section>

        {/* 8. User Rights */}
        <Section id="rights" title="8. Your Rights">
          <Paragraph>Under the GDPR, you have the following rights:</Paragraph>
          <List
            items={[
              "Right of access: request a copy of the personal data we hold about you.",
              "Right to rectification: correct inaccurate or incomplete data.",
              "Right to erasure: request deletion of your data (the 'right to be forgotten').",
              "Right to restriction: ask us to limit how we process your data in certain situations.",
              "Right to data portability: receive your data in a structured, machine-readable format.",
              "Right to object: object to processing based on legitimate interests.",
              "Right to withdraw consent: where processing relies on consent, withdraw it at any time.",
              "Right to complain: lodge a complaint with your local data protection supervisory authority.",
            ]}
          />
          <Paragraph>
            To exercise any of these rights, email us at {CONTACT_EMAIL}. We will respond within
            30 days. You may also ask us to delete your booking records at any time.
          </Paragraph>
        </Section>

        {/* 9. Cookies and Tracking */}
        <Section id="cookies" title="9. Cookies and Tracking">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm whether the Service sets any cookies or local
            storage; if non-essential cookies are added, a consent banner is required under
            GDPR/ePrivacy. */}
            Our Service stores data in Google Sheets and communicates via Facebook Messenger; it
            does not set advertising cookies. The Facebook Messenger platform may set cookies
            according to Meta&rsquo;s own cookie policy, which you can review on Meta&rsquo;s website. We do
            not use third-party tracking or advertising cookies.
          </Paragraph>
        </Section>

        {/* 10. Security */}
        <Section id="security" title="10. Security">
          <List
            items={[
              "Encryption: data is transferred over encrypted connections (HTTPS) and Google Sheets data is encrypted at rest by Google.",
              "Access control: only authorized personnel and automated systems with valid credentials can access the data.",
              "Incident response: we have procedures to detect and respond to data breaches, including notifying affected users and authorities where required by law.",
            ]}
          />
          <Paragraph>
            No method of transmission or storage is 100% secure; we cannot guarantee absolute
            security, but we work to protect your data to a reasonable and industry-standard level.
          </Paragraph>
        </Section>

        {/* 11. Children's Privacy */}
        <Section id="children" title="11. Children's Privacy">
          <Paragraph>
            Our Service is not directed at children, and we do not knowingly collect personal data
            from children under the age of 16. If you believe a child has provided us with personal
            data, contact us at {CONTACT_EMAIL} and we will delete it.
            {/* LEGAL REVIEW REQUIRED: confirm age thresholds under applicable law (e.g., 13 under
            COPPA in the US, 13-16 under GDPR member-state rules) and whether an age gate is
            needed. */}
          </Paragraph>
        </Section>

        {/* 12. Contact and Rights */}
        <Section id="contact" title="12. Contact Information">
          <Paragraph>For any privacy questions or data subject requests, contact us at:</Paragraph>
          <List
            items={[
              `Email: ${CONTACT_EMAIL}`,
              `Company: ${COMPANY_NAME}`,
              `Address: ${COMPANY_ADDRESS}`,
            ]}
          />
          <Paragraph>We aim to respond to all legitimate requests within 30 days.</Paragraph>
        </Section>

        {/* 13. Policy Changes */}
        <Section id="changes" title="13. Changes to This Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time. When we make material changes, we
            will update the &ldquo;Last updated&rdquo; date at the top of this page and, where appropriate,
            notify you directly through the channels we use to communicate with you. We encourage
            you to review this page periodically.
          </Paragraph>
        </Section>

        {/* 14. Additional Provisions */}
        <Section id="additional" title="14. Additional Provisions">
          <List
            items={[
              "No sale of data: we do not sell, rent, or trade your personal data.",
              "Third-party links: our Service may link to third-party websites; we are not responsible for their privacy practices.",
              "Governing law: this policy is governed by the laws of Pakistan, where we are established, subject to your rights under the GDPR.",
              `Effective date: this policy became effective on ${LAST_UPDATED}.`,
            ]}>
          </List>
          {/* LEGAL REVIEW REQUIRED: confirm the governing law clause and jurisdiction with
          counsel, particularly regarding the GDPR territorial scope (Art. 3). */}
        </Section>

      </main>
      <Footer />
    </div>
  );
}
