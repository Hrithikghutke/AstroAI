"use client";

import { useBrand } from "@/context/BrandContext";
import EditableText from "@/components/ui/EditableText";

export default function Footer({
  editable = false,
  onUpdate,
}: {
  editable?: boolean;
  onUpdate?: (field: string, value: string) => void;
}) {
  const brand = useBrand();

  return (
    <div className="border-t border-neutral-800 py-8 @md:py-10 px-4 @md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col @sm:flex-row items-center justify-between gap-4 text-neutral-500 text-xs @md:text-sm">
        <div className="flex items-center gap-2 font-semibold">
          {brand.logo && brand.logo.startsWith("<svg") ? (
            <span
              style={{ width: 24, height: 24, display: "inline-flex" }}
              dangerouslySetInnerHTML={{
                __html: brand.logo
                  .replace(/width="48"/, 'width="24"')
                  .replace(/height="48"/, 'height="24"'),
              }}
            />
          ) : (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: brand.primaryColor }}
            />
          )}
          {editable ? (
            <EditableText
              value={brand.logoText ?? "Brand"}
              onSave={(v) => onUpdate?.("logoText", v)}
            />
          ) : (
            (brand.logoText ?? "Brand")
          )}
        </div>

        <p className="text-center">
          © {new Date().getFullYear()} {brand.logoText ?? "Brand"}. All rights
          reserved.
        </p>

        <div className="flex gap-4 @md:gap-6">
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}
