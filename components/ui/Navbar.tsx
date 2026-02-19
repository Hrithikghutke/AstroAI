import { useBrand } from "@/context/BrandContext";

export default function Navbar({ primaryColor }: any) {
  const brand = useBrand();
  return (
    <div className="flex justify-between items-center px-8 py-6 border-b border-neutral-800">
      <h1 className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: brand.primaryColor }}
        />
        {brand?.logoText || "AI Builder"}
      </h1>

      <div className="flex gap-6 text-sm">
        <a href="#">Features</a>
        <a href="#">Pricing</a>
        <a href="#">Contact</a>
      </div>

      <button
        style={{ backgroundColor: primaryColor }}
        className="px-4 py-2 rounded-lg text-black font-medium"
      >
        Get Started
      </button>
    </div>
  );
}
