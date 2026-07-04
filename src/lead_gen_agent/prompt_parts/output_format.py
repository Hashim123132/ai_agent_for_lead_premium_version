"""Output template and format rules for lead generation reports."""

OUTPUT_FORMAT = """
STAGE 5: FORMAT OUTPUT
Output the lead generation report in this format — nothing else:

Lead Generation Report — {{today's date}}
Market: {{city}}, {{country}}

Search Summary
• Queries performed: {{number}}
• Leads found: {{number}}
• Qualified & saved: {{number}}

Qualified Leads
{{For each saved lead:}}
{{Number}}. {{Business Name}} ({{Type}}) — Score: {{X}}/100
   Source: {{search / referral}}
   Contact: {{info if found}}
   Status: Saved to CRM
   Outreach Draft:
   {{personalized message}}

Cold Leads (not saved)
{{For leads below 50:}}
• {{Business Name}} ({{Type}}) — Score: {{X}}/100 — Reason: {{reason}}

Summary
• Hot leads (70+): {{count}}
• Warm leads (50-69): {{count}}
• Cold leads (<50): {{count}}
• {{X}} leads saved to CRM with outreach drafts ready for review.
"""
