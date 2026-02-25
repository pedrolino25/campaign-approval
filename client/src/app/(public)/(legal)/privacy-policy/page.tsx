import type { Metadata } from "next";

import { Navbar } from "@/components/landing-pages/navbar/navbar";
import FooterSection from "@/components/landing-pages/sections/footer";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services.",
  keywords: [
    "privacy policy",
    "data protection",
    "personal information",
    "website privacy",
  ],
  openGraph: {
    title: "Privacy Policy",
    description:
      "This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website and services.",
    url: "https://worklient.com/privacy-policy",
    siteName: "Worklient",
    type: "website",
  },
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <Container className="sm:px-5 md:px-10 !py-30 flex flex-col gap-5">
        <h1 className="text-h3 lg:text-h2">Privacy Policy</h1>
        <p className="text-body lg:text-body-lg">Last updated: February 20, 2026</p>

        <h2 className="text-body-lg lg:text-h3">1. Introduction</h2>
        <p className="text-body lg:text-body-lg">This Privacy Policy explains how Worklient collects, uses, discloses, and safeguards information when you access or use the Worklient platform and related services. By using the service, you acknowledge that you have read and understood this Privacy Policy.</p>

        <h2 className="text-body-lg lg:text-h3">2. Scope of This Policy</h2>
        <p className="text-body lg:text-body-lg">This Privacy Policy applies to organizations that create accounts on Worklient, internal users invited to those organizations, and external reviewers who access shared assets through secure links. It covers information processed in connection with providing the campaign approval platform.</p>

        <h2 className="text-body-lg lg:text-h3">3. Information We Collect</h2>
        <p className="text-body lg:text-body-lg">We collect information provided directly by organizations and users, including names, email addresses, organization details, and role-based permissions. We also collect content submitted to the platform, including creative assets, comments, approval decisions, and workflow activity. External reviewers may provide identifying information when submitting feedback or approvals. In addition, we collect technical and usage information such as IP address, browser type, device information, timestamps, and interaction logs necessary to operate, secure, and improve the service.</p>

        <h2 className="text-body-lg lg:text-h3">4. How We Use Information</h2>
        <p className="text-body lg:text-body-lg">We use collected information to provide and maintain the service, authenticate users, enable structured approval workflows, record audit activity, send notifications related to reviews and approvals, ensure system security, analyze performance, and comply with legal obligations. Information is processed solely for purposes consistent with delivering the campaign approval infrastructure.</p>

        <h2 className="text-body-lg lg:text-h3">5. Legal Basis for Processing</h2>
        <p className="text-body lg:text-body-lg">Where applicable under data protection laws, we process personal data based on contractual necessity to provide the service, legitimate interests in maintaining secure and reliable operations, compliance with legal obligations, and consent where required. Organizations are responsible for ensuring they have a lawful basis to upload and share personal data through the platform.</p>

        <h2 className="text-body-lg lg:text-h3">6. Data Sharing and Disclosure</h2>
        <p className="text-body lg:text-body-lg">We do not sell personal data. We may share information with trusted service providers that support hosting, infrastructure, email delivery, analytics, and security operations. These providers are bound by contractual obligations to protect data. We may also disclose information when required by law, regulation, or legal process. Content and activity data submitted by external reviewers are visible only to the organization that shared the review link.</p>

        <h2 className="text-body-lg lg:text-h3">7. Data Retention</h2>
        <p className="text-body lg:text-body-lg">We retain personal data for as long as necessary to provide the service and maintain approval records. Audit logs, comments, and approval history may be retained to preserve operational traceability and compliance integrity. Upon account termination, data may be deleted or anonymized in accordance with applicable laws and internal retention policies.</p>

        <h2 className="text-body-lg lg:text-h3">8. Security Measures</h2>
        <p className="text-body lg:text-body-lg">Worklient implements reasonable technical and organizational safeguards designed to protect information from unauthorized access, loss, misuse, or alteration. These measures include access controls, encryption in transit, and secure infrastructure management. While we strive to protect information, no system can guarantee absolute security.</p>

        <h2 className="text-body-lg lg:text-h3">9. International Data Transfers</h2>
        <p className="text-body lg:text-body-lg">If personal data is transferred across borders, we take appropriate steps to ensure that such transfers comply with applicable data protection laws and that adequate safeguards are in place to protect the information.</p>

        <h2 className="text-body-lg lg:text-h3">10. Cookies and Tracking Technologies</h2>
        <p className="text-body lg:text-body-lg">We use cookies and similar technologies to maintain sessions, enhance user experience, monitor platform performance, and ensure security. Users may control cookie preferences through browser settings, though disabling cookies may affect certain features of the service.</p>

        <h2 className="text-body-lg lg:text-h3">11. User Rights</h2>
        <p className="text-body lg:text-body-lg">Depending on applicable law, individuals may have rights to access, correct, delete, or restrict processing of their personal data, as well as rights to data portability or objection. Requests to exercise these rights should be directed to the organization controlling the data or to Worklient at the contact information provided below.</p>

        <h2 className="text-body-lg lg:text-h3">12. Children’s Privacy</h2>
        <p className="text-body lg:text-body-lg">The service is not intended for use by individuals under the age of eighteen. We do not knowingly collect personal data from minors. If we become aware of such data being collected, we will take appropriate steps to remove it.</p>

        <h2 className="text-body-lg lg:text-h3">13. Changes to This Policy</h2>
        <p className="text-body lg:text-body-lg">We may update this Privacy Policy from time to time to reflect changes in legal requirements or service functionality. Updates will be indicated by the revised “Last updated” date. Continued use of the service after changes become effective constitutes acceptance of the updated policy.</p>

        <h2 className="text-body-lg lg:text-h3">14. Contact Information</h2>
        <p className="text-body lg:text-body-lg">For questions about this Privacy Policy or data protection practices, please contact privacy@worklient.com.</p>
      </Container>
      <FooterSection />
    </>
  )
}
