import { Seo } from "@/components/Seo";
import LegalPage, { LegalSection, LegalList } from "@/components/editorial/LegalPage";

const Terms = () => (
  <>
    <Seo title="Terms & Conditions — Loverball" description="The terms that govern your use of the Loverball platform and services." path="/terms" />
    <LegalPage kicker="Legal · Terms" title="Terms & Conditions" updated="Last updated · January 15, 2026">
      <LegalSection title="1. Agreement to Terms">
        <p>By accessing or using the Loverball platform, website, and services (collectively, the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). These Terms are a legally binding agreement between you and Loverball LLC. If you do not agree, you may not access or use the Service.</p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>You must be at least 18 years old to use the Service. By using the Service, you represent that you are at least 18 and have the legal capacity to enter into these Terms.</p>
      </LegalSection>

      <LegalSection title="3. Account Registration">
        <p>To access certain features, you must create an account. You agree to provide accurate, current, and complete information and to keep it updated. You are responsible for safeguarding your credentials and for all activity that occurs under your account.</p>
      </LegalSection>

      <LegalSection title="4. Membership and Invite Codes">
        <p>Loverball operates as an invite-only community. Access to full membership features requires a valid invite code. Invite codes are non-transferable and may expire or be revoked at our discretion.</p>
      </LegalSection>

      <LegalSection title="5. User Conduct">
        <p>You agree not to use the Service to:</p>
        <LegalList items={[
          "Violate any applicable law or regulation",
          "Harass, abuse, or harm another person",
          "Post false, misleading, or fraudulent content",
          "Impersonate any person or entity",
          "Collect or harvest user data without consent",
          "Interfere with the proper functioning of the Service",
          "Attempt to gain unauthorized access to any portion of the Service",
          "Use the Service for any commercial purpose without prior written consent",
        ]} />
      </LegalSection>

      <LegalSection title="6. User Content">
        <p>You retain ownership of content you submit to the Service ("User Content"). By submitting User Content, you grant Loverball LLC a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display it in connection with the Service. You represent that you have all rights necessary to grant this license.</p>
      </LegalSection>

      <LegalSection title="7. Privacy">
        <p>Your use of the Service is subject to our Privacy Policy, which is incorporated by reference. Please review it to understand our practices regarding your personal information.</p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>The Service and its original content, features, and functionality are owned by Loverball LLC and protected by international copyright, trademark, and other laws. The Loverball name, logo, and related marks are trademarks of Loverball LLC.</p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>We may terminate or suspend your account and access to the Service immediately, without notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service ceases.</p>
      </LegalSection>

      <LegalSection title="10. Disclaimer of Warranties">
        <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
      </LegalSection>

      <LegalSection title="11. Limitation of Liability">
        <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOVERBALL LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL.</p>
      </LegalSection>

      <LegalSection title="12. Governing Law">
        <p>These Terms are governed by the laws of the State of California. Any legal action arising under these Terms shall be brought exclusively in the courts located in Los Angeles County, California.</p>
      </LegalSection>

      <LegalSection title="13. Changes to Terms">
        <p>We may modify these Terms at any time. If a revision is material, we will provide at least 30 days' notice. Continued use of the Service after changes take effect constitutes acceptance.</p>
      </LegalSection>

      <LegalSection title="14. Contact Us">
        <p>Questions about these Terms? Reach us at:</p>
        <p><strong>Loverball LLC</strong><br/>Los Angeles, California<br/>Email: legal@loverball.com</p>
      </LegalSection>
    </LegalPage>
  </>
);

export default Terms;
