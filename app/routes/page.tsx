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
    <main className="min-h-screen bg-white p-8 text-black">
      <h1 className="text-5xl font-bold">BAAGAY routes</h1>
      <div className="mt-8 grid gap-3">
        {routes.map(([href, label]) => (
          <Link key={href} href={href} className="border border-line p-4 font-bold">
            {label}: {href}
          </Link>
        ))}
      </div>
    </main>
  );
}
