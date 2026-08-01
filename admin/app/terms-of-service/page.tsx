import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | FleetOps",
  description:
    "Terms of Service for FleetOps — the terms that govern your use of our AI-powered fleet booking service.",
};

/*
 * LEGAL REVIEW REQUIRED (all flagged clauses below):
 * - Section 2 (Service): confirm the description of the service matches what we actually offer.
 * - Section 4 (Bookings): confirm liability allocation between the platform and the rental
 *   operator; the rental contract may need to be signed separately by the customer.
 * - Section 8 (Payments): confirm refund and cancellation policies with the business.
 * - Section 10 (Disclaimers): verify the limitation of liability clause with counsel; some
 *   jurisdictions restrict or prohibit certain exclusions (e.g., implied warranties,
 *   liability for gross negligence).
 * - Section 12 (Third-Party): confirm the list of third parties (Meta, Google, Render,
 *   AI providers) matches the current data flows.
 * - Section 15 (Governing Law): company is based in Lahore, Pakistan; confirm the governing
 *   law clause and dispute resolution mechanism with counsel.
 * - Section 16 (Age): confirm the minimum age requirement under applicable law.
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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" />

      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: {LAST_UPDATED}
        </p>

        {/* 1. Acceptance of Terms */}
        <Section id="acceptance" title="1. Acceptance of These Terms">
          <Paragraph>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the {COMPANY_NAME}{" "}
            platform and services (the &ldquo;Service&rdquo;), including AI-powered fleet booking tools,
            booking confirmations, and follow-ups delivered through Facebook Messenger and the
            booking management tools we operate from {COMPANY_ADDRESS}.
          </Paragraph>
          <Paragraph>
            By accessing or using the Service, you agree to be bound by these Terms. If you do
            not agree to any part of these Terms, you may not access or use the Service.
          </Paragraph>
        </Section>

        {/* 2. The Service */}
        <Section id="service" title="2. The Service">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm this description matches the actual functionality
            offered. */}
            The Service lets you book vehicles, check car availability, receive booking
            confirmations, and get follow-up messages about incomplete bookings. The Service is
            operated by {COMPANY_NAME}, based at {COMPANY_ADDRESS}, and is currently provided free of
            charge unless stated otherwise on the pricing page.
          </Paragraph>
          <Paragraph>
            We may update, suspend, or discontinue any part of the Service at any time, with or
            without notice.
          </Paragraph>
        </Section>

        {/* 3. Eligibility */}
        <Section id="eligibility" title="3. Eligibility">
          <Paragraph>
            You must be at least 18 years old to use the Service. By using the Service, you
            represent and warrant that you meet this requirement.
          </Paragraph>
        </Section>

        {/* 4. Bookings and Rental Agreements */}
        <Section id="bookings" title="4. Bookings and Rental Agreements">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm liability allocation between the platform and the
            rental operator; the rental contract may need to be signed separately. */}
            When you make a booking through the Service, the booking details you provide (car,
            pickup location, pickup time, return time, and contact information) are used to
            process your reservation. The Service facilitates bookings but is not itself a car
            rental company; the rental agreement is between you and the operator.
          </Paragraph>
          <Paragraph>
            We aim to provide accurate availability information, but availability can change and
            we do not guarantee that a car shown as available will be reserved until confirmed.
          </Paragraph>
        </Section>

        {/* 5. User Obligations */}
        <Section id="obligations" title="5. Your Obligations">
          <Paragraph>When using the Service, you agree to:</Paragraph>
          <List
            items={[
              "Provide accurate and current information, including your name, phone number, and email address.",
              "Use the Service only for lawful purposes and in accordance with these Terms.",
              "Not attempt to disrupt, interfere with, or gain unauthorized access to the Service or its systems.",
              "Not misuse the Service to send spam, misleading, or unlawful messages.",
              "Keep your contact details up to date so we can reach you about your bookings.",
            ]}
          />
        </Section>

        {/* 6. Payments */}
        <Section id="payments" title="6. Payments and Fees">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm refund and cancellation policies with the business. */}
            The Service is currently offered free of charge. If we introduce paid features or
            fees in the future, they will be communicated clearly before you incur them. Any
            applicable fees are payable in the currency and payment method indicated at the time
            of purchase.
          </Paragraph>
        </Section>

        {/* 7. AI Services and Messenger */}
        <Section id="ai-services" title="7. AI Services and Facebook Messenger">
          <Paragraph>
            The Service uses AI-powered agents to answer questions, process bookings, and send
            follow-up messages via Facebook Messenger. Responses are automated and provided on
            an &ldquo;as is&rdquo; basis.
          </Paragraph>
          <Paragraph>
            By contacting us through Facebook Messenger, you agree to receive automated
            messages related to your booking, including confirmations and follow-up messages
            about incomplete bookings. You may opt out of follow-up messages at any time by
            replying to the message or contacting us at {CONTACT_EMAIL}.
          </Paragraph>
        </Section>

        {/* 8. Intellectual Property */}
        <Section id="ip" title="8. Intellectual Property">
          <Paragraph>
            The Service, including its software, design, text, graphics, and other content, is
            owned by {COMPANY_NAME} or its licensors and is protected by applicable intellectual
            property laws. You may not copy, modify, distribute, sell, or create derivative
            works from any part of the Service without our prior written permission.
          </Paragraph>
        </Section>

        {/* 9. Acceptable Use */}
        <Section id="acceptable-use" title="9. Acceptable Use">
          <Paragraph>You agree not to use the Service to:</Paragraph>
          <List
            items={[
              "Violate any applicable law or regulation.",
              "Infringe the rights of any third party, including intellectual property and privacy rights.",
              "Transmit any harmful code, viruses, or other disruptive materials.",
              "Attempt to probe, scan, or test the vulnerability of the Service or its infrastructure.",
              "Impersonate any person or entity or misrepresent your affiliation with us.",
            ]}
          />
        </Section>

        {/* 10. Disclaimers and Limitation of Liability */}
        <Section id="disclaimers" title="10. Disclaimers and Limitation of Liability">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: verify the limitation of liability clause with counsel;
            some jurisdictions restrict or prohibit certain exclusions. */}
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
            warranties of any kind, whether express or implied, including but not limited to
            implied warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </Paragraph>
          <Paragraph>
            To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of
            profits, data, or goodwill, arising out of or in connection with your use of the
            Service.
          </Paragraph>
          <Paragraph>
            Nothing in these Terms limits or excludes liability that cannot be limited or
            excluded under applicable law.
          </Paragraph>
        </Section>

        {/* 11. Indemnification */}
        <Section id="indemnification" title="11. Indemnification">
          <Paragraph>
            You agree to indemnify and hold harmless {COMPANY_NAME} and its officers, employees,
            and agents from and against any claims, damages, liabilities, and expenses arising
            out of your use of the Service, your breach of these Terms, or your violation of
            any law or the rights of a third party.
          </Paragraph>
        </Section>

        {/* 12. Third-Party Services */}
        <Section id="third-party" title="12. Third-Party Services">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm the list of third parties matches current data
            flows. */}
            The Service integrates with third-party services, including Facebook Messenger
            (Meta), Google Sheets, our hosting provider (Render), and AI providers. Your use of
            those services may be subject to their own terms and privacy policies. We are not
            responsible for the practices of third parties, including Meta&rsquo;s handling of
            Messenger data.
          </Paragraph>
        </Section>

        {/* 13. Termination */}
        <Section id="termination" title="13. Termination">
          <Paragraph>
            We may suspend or terminate your access to the Service at any time, with or without
            cause, and with or without notice. You may stop using the Service at any time. On
            termination, your right to use the Service ends immediately, and we may delete
            data associated with your use, subject to our Privacy Policy and legal obligations.
          </Paragraph>
        </Section>

        {/* 14. Changes to These Terms */}
        <Section id="changes" title="14. Changes to These Terms">
          <Paragraph>
            We may update these Terms from time to time. When we make material changes, we will
            update the &ldquo;Last updated&rdquo; date at the top of this page and, where appropriate,
            notify you through the channels we use to communicate with you. Continued use of
            the Service after changes take effect constitutes acceptance of the revised Terms.
          </Paragraph>
        </Section>

        {/* 15. Governing Law and Disputes */}
        <Section id="governing-law" title="15. Governing Law and Disputes">
          <Paragraph>
            {/* LEGAL REVIEW REQUIRED: confirm the governing law clause and dispute resolution
            mechanism with counsel. */}
            These Terms are governed by the laws of Pakistan, where {COMPANY_NAME} is established,
            without regard to conflict-of-law principles. Any disputes arising out of or related
            to these Terms or the Service shall be subject to the exclusive jurisdiction of the
            courts of Pakistan, subject to your rights under the GDPR and other mandatory
            protections.
          </Paragraph>
        </Section>

        {/* 16. Contact */}
        <Section id="contact" title="16. Contact Us">
          <Paragraph>If you have any questions about these Terms, contact us at:</Paragraph>
          <List
            items={[
              `Email: ${CONTACT_EMAIL}`,
              `Company: ${COMPANY_NAME}`,
              `Address: ${COMPANY_ADDRESS}`,
            ]}
          />
        </Section>
      </main>
      <Footer />
    </div>
  );
}
