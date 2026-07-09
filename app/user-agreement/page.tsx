import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "User Agreement | BAAGAY",
  description: "The terms that govern your use of the BAAGAY website and purchases from our store.",
};

export default function UserAgreementPage() {
  return (
    <LegalPage
      title="User Agreement"
      updated="9 July 2026"
      intro="These terms govern your use of the BAAGAY website and any purchase you make from us. By browsing the site, creating an account, or placing an order, you agree to them."
    >
      <LegalSection heading="Who we are">
        <p>
          BAAGAY sells contemporary hand-tied Bandhani clothing, made with artisan communities across Kutch and Saurashtra, Gujarat, India. &ldquo;We&rdquo;, &ldquo;us&rdquo; and &ldquo;BAAGAY&rdquo; in this agreement refer to BAAGAY Studio, Vadodara, Gujarat, India.
        </p>
      </LegalSection>

      <LegalSection heading="Products and handcraft variation">
        <p>
          Every piece is individually hand-tied and hand-dyed. Colours, dot placement, and pattern density vary from piece to piece and may differ slightly from product photography. This variation is inherent to the craft and is not a defect.
        </p>
      </LegalSection>

      <LegalSection heading="Orders, pricing, and availability">
        <p>All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Inventory is small-batch; an item may sell out between the time you add it to cart and checkout.</p>
        <p>We may cancel and fully refund any order affected by an obvious pricing or listing error, or where we suspect fraud. We will always tell you if this happens.</p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          You are responsible for keeping your account credentials safe and for activity that happens under your account. Provide accurate contact and delivery details — we are not responsible for deliveries that fail because of incorrect information.
        </p>
      </LegalSection>

      <LegalSection heading="Returns and refunds">
        <p>
          Returns, exchanges, and refunds are governed by our <a href="/refund-policy" className="font-semibold text-green-dark underline">Refund Policy</a>, which forms part of this agreement.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          The BAAGAY name, logo, hand-painted artwork, photography, and all website content belong to us or our licensors. You may not copy, reproduce, or use them commercially without our written permission. The traditional Bandhani craft itself belongs to its artisan communities — our designs are made with them, and credit for the craft is always theirs.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>Do not misuse the website: no attempts to breach security, scrape data, place fraudulent orders, or interfere with other users. We may suspend accounts that do.</p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, our liability for any claim related to an order is limited to the amount you paid for that order. We are not liable for indirect or consequential losses. Nothing in this agreement limits rights you have under Indian consumer protection law that cannot be waived.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>This agreement is governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the courts of Vadodara, Gujarat.</p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>We may update these terms from time to time; the date at the top shows the latest version. Continuing to use the site after a change means you accept the updated terms.</p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this agreement? Email <strong>hello@baagay.in</strong> or write to BAAGAY Studio, Vadodara, Gujarat, India.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
