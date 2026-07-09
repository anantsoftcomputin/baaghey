import { Leaf, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";

const VALUES = [
  { icon: Truck, label: "Free Shipping" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Sparkles, label: "Handcrafted" },
  { icon: Leaf, label: "Sustainable" },
  { icon: ShieldCheck, label: "Secure Payment" },
];

export function ValuesStrip() {
  return (
    <section className="container-max border-y border-line px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {VALUES.map((value) => {
          const Icon = value.icon;
          return (
            <div key={value.label} className="flex flex-col items-center gap-2.5 text-center">
              <Icon size={24} strokeWidth={1.5} />
              <p className="text-xs font-semibold uppercase tracking-[0.08em]">{value.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
