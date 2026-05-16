import { Seo } from "@/components/Seo";
import LegalPage, { LegalSection, LegalList } from "@/components/editorial/LegalPage";

const Privacy = () => (
  <>
    <Seo title="Privacy Policy — Loverball" description="How Loverball collects, uses, and protects your information." path="/privacy" />
    <LegalPage kicker="Legal · Privacy" title="Privacy Policy" updated="Last updated · January 15, 2026">
      <LegalSection title="1. Introduction">
        <p>Loverball LLC ("Loverball," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, and services (collectively, the "Service"). By using the Service, you consent to the practices described here.</p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>We collect information you provide directly to us, including:</p>
        <LegalList items={[
          <><strong>Account information</strong> — name, email, password, and profile photo.</>,
          <><strong>Profile information</strong> — age range, location, neighborhood, bio, favorite sports, teams, and other preferences you choose to share.</>,
          <><strong>Social links</strong> — Instagram, TikTok, LinkedIn, and website URLs you optionally provide.</>,
          <><strong>Communications</strong> — messages you send to other members through our platform.</>,
          <><strong>Event information</strong> — RSVPs and participation in community events.</>,
          <><strong>Usage data</strong> — information about how you interact with the Service.</>,
        ]} />
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <LegalList items={[
          "Provide, maintain, and improve the Service",
          "Create and manage your account",
          "Facilitate connections and matches with other members",
          "Send you updates, notifications, and promotional communications",
          "Respond to your comments, questions, and requests",
          "Monitor and analyze trends, usage, and activities",
          "Detect, investigate, and prevent fraud and abuse",
          "Personalize and improve your experience",
        ]} />
      </LegalSection>

      <LegalSection title="4. Information Sharing and Disclosure">
        <p>We may share your information in the following circumstances:</p>
        <LegalList items={[
          <><strong>With other members</strong> — your profile is visible to other members. Sensitive details (social links, neighborhood, age range) are only shared with members you have matched with.</>,
          <><strong>Service providers</strong> — third-party vendors who perform services on our behalf.</>,
          <><strong>Legal requirements</strong> — if required by law or in response to valid legal requests.</>,
          <><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets.</>,
          <><strong>With your consent</strong> — when you direct us to share.</>,
        ]} />
      </LegalSection>

      <LegalSection title="5. Data Security">
        <p>We implement appropriate technical and organizational measures to protect your personal information. No method of transmission over the Internet is completely secure; while we strive to protect your information, we cannot guarantee absolute security.</p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>We retain your personal information for as long as your account is active or as needed to provide you with the Service. You may request deletion of your account and associated data at any time.</p>
      </LegalSection>

      <LegalSection title="7. Your Rights and Choices">
        <LegalList items={[
          <><strong>Access</strong> — update your profile information through account settings.</>,
          <><strong>Deletion</strong> — request deletion of your account and personal data.</>,
          <><strong>Opt-out</strong> — unsubscribe from promotional communications.</>,
          <><strong>Portability</strong> — request a copy of your personal data.</>,
        ]} />
      </LegalSection>

      <LegalSection title="8. California Privacy Rights">
        <p>If you are a California resident, you have additional rights under the CCPA, including the right to know what personal information we collect, the right to delete it, and the right to opt out of its sale. We do not sell personal information to third parties.</p>
      </LegalSection>

      <LegalSection title="9. Children's Privacy">
        <p>The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have, we will take steps to delete it.</p>
      </LegalSection>

      <LegalSection title="10. International Data Transfers">
        <p>Your information may be transferred to and processed in countries other than your country of residence. By using the Service, you consent to the transfer of your information to the United States and other countries.</p>
      </LegalSection>

      <LegalSection title="11. Changes to This Privacy Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you by posting the new policy on this page and updating the "Last updated" date.</p>
      </LegalSection>

      <LegalSection title="12. Contact Us">
        <p>Questions about this Privacy Policy or our practices? Reach us at:</p>
        <p><strong>Loverball LLC</strong><br/>Los Angeles, California<br/>Email: privacy@loverball.com</p>
      </LegalSection>
    </LegalPage>
  </>
);

export default Privacy;
