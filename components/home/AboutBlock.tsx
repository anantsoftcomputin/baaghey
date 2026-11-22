import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Wordmark } from "@/components/Wordmark";

export function AboutBlock() {
  return (
    <section id="about" className="grid scroll-mt-24 items-center gap-10 pb-20 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:pb-28">
      <Reveal variant="image" className="grid aspect-[16/9] place-items-center bg-green md:aspect-[2/1]">
        <Wordmark tone="yellow" className="text-[18vw] md:text-[7vw]" />
      </Reveal>
      <div className="gutter max-w-sm md:px-0">
        <Reveal as="h2" className="section-title">About us</Reveal>
        <Reveal as="p" className="mt-4 text-[13px] leading-6 text-ink/75">BAAGAY — a garden — is a small label from Vadodara working with Bandhani artisans across Gujarat. We cut their hand-tied cloth into easy, contemporary clothes, so a craft carried for generations can be worn every day, not only saved for the festival.</Reveal>
        <Reveal><Link href="/journal" className="text-link mt-6">Know more</Link></Reveal>
      </div>
    </section>
  );
}
