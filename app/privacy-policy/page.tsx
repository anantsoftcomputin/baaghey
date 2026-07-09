import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | BAAGAY",
  description: "How BAAGAY collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="9 July 2026"
      intro="BAAGAY respects your privacy. This policy explains what information we collect when you use our website, why we collect it, and the choices you have over it."
    >
      <LegalSection heading="Information we collect">
        <p>
          <strong>Account details.</strong> When you register — by email, Google sign-in, or phone OTP — we store your name, email address and/or phone number so we can recognise you and manage your account.
        </p>
        <p>
          <strong>Requests you send us.</strong> When you reserve a piece or send a wishlist request, we store the details you submit (name, email, the product you asked about, and any note).
        </p>
        <p>
          <strong>Newsletter.</strong> If you subscribe, we store your email address so we can send you our updates.
        </p>
        <p>
          <strong>Order and delivery details.</strong> If you place an order, we collect the shipping address and contact details needed to fulfil it.
        </p>
      </LegalSection>

      <LegalSection heading="How we use your information">
        <p>We use your information to operate the store: to fulfil orders and reservations, respond to your requests, maintain your account, and — only if you subscribed — send you our newsletter.</p>
        <p>We do not sell, rent, or trade your personal information to anyone.</p>
      </LegalSection>

      <LegalSection heading="Where your data lives">
        <p>
          Our website runs on Google Firebase. Account, catalog, and request data is stored in Firebase services (Authentication and Realtime Database) and is protected by Google&rsquo;s infrastructure security. Payments, when offered, are processed by third-party payment providers — we never see or store your full card details.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and analytics">
        <p>We use only the cookies and local storage needed for the site to function — for example, keeping you signed in. We do not run third-party advertising trackers.</p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask us at any time to show you the personal data we hold about you, correct it, or delete it. Write to <strong>hello@baagay.in</strong> and we will respond within 30 days. Newsletter emails always include a way to unsubscribe.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>If we change this policy, we will update the date at the top of this page. Significant changes will be announced on the website.</p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about privacy? Email <strong>hello@baagay.in</strong> or write to BAAGAY Studio, Vadodara, Gujarat, India.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
