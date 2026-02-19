export default function Footer({ brand }: any) {
  return (
    <div className="border-t border-neutral-800 py-10 text-center text-neutral-500">
      © {new Date().getFullYear()} {brand.logoText}. All rights reserved.
    </div>
  );
}
