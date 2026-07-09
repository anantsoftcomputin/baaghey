import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy | BAAGAY",
  description: "BAAGAY's returns, exchanges, and refund policy for hand-tied Bandhani garments.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="9 July 2026"
      intro="Every BAAGAY piece is hand-tied and hand-dyed, and we want you to love wearing it. If something isn't right, here is exactly how returns, exchanges, and refunds work."
    >
      <LegalSection heading="A note on handcraft">
        <p>
          Bandhani is a living craft. Small irregularities in the dots, gentle variations in colour, and slight differences between the product photo and the piece you receive are the <strong>signature of hand work, not defects</strong>, and are not grounds for return on their own. What does qualify is described below.
        </p>
      </LegalSection>

      <LegalSection heading="Returns">
        <p>
          You may request a return within <strong>7 days of delivery</strong> if the piece is unworn, unwashed, and has all tags attached. To start a return, email <strong>hello@baagay.in</strong> with your order number and a short note (photos help if something arrived damaged).
        </p>
        <p>Once we receive and inspect the piece, we will confirm your refund by email.</p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          Approved refunds are issued to your original payment method within <strong>7–10 business days</strong> of us receiving the return. Shipping charges, where applied, are non-refundable unless the return is due to our error or a transit-damaged piece.
        </p>
      </LegalSection>

      <LegalSection heading="Exchanges">
        <p>
          Need a different size? We are happy to exchange within the same 7-day window, subject to stock. Since each piece is dyed in small batches, the replacement will carry its own hand-tied pattern — no two are identical.
        </p>
      </LegalSection>

      <LegalSection heading="Damaged or incorrect items">
        <p>
          If your order arrives damaged or you received the wrong item, tell us within <strong>48 hours of delivery</strong> with photos of the piece and packaging. We will arrange a replacement or full refund, including shipping, at no cost to you.
        </p>
      </LegalSection>

      <LegalSection heading="What cannot be returned">
        <p>Pieces that have been worn, washed, altered, or had tags removed; and pieces bought on final-sale or made-to-order/customised terms (this is always stated on the product page before you buy).</p>
      </LegalSection>

      <LegalSection heading="Care reminder">
        <p>
          To keep your piece beautiful — and returnable if needed — follow the care card: <strong>dry clean or hand wash separately in cold water; machine wash is not recommended</strong>. Damage caused by machine washing is not covered.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          For any return or refund question, email <strong>hello@baagay.in</strong> or call <strong>+91 98765 43210</strong>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
