import Link from "next/link";

const routes = [
  ["/", "Home"],
  ["/shop", "Shop"],
  ["/collections", "Collections"],
  ["/products/teal-bandhani-full-sleeve-shirt", "Teal Bandhani product"],
  ["/admin", "Admin"],
];

export default function RoutesPage() {
  return (
    <main className="min-h-screen bg-[#fffdf1] p-8 text-ink">
      <h1 className="font-display text-5xl font-bold">BAAGAY routes</h1>
      <div className="mt-8 grid gap-3">
        {routes.map(([href, label]) => (
          <Link key={href} href={href} className="glass-card p-4 font-bold">
            {label}: {href}
          </Link>
        ))}
      </div>
    </main>
  );
}
