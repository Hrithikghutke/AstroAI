export default function Hero({ data }: any) {
  const { headline, subtext, cta } = data;

  return (
    <section className="py-32 px-50 text-center">
      <h1 className="text-6xl font-bold mb-6">{headline}</h1>

      <p className="text-neutral-400 max-w-2xl mx-auto mb-10">{subtext}</p>

      {cta && (
        <button
          className="px-8 py-4 transition-all duration-300"
          style={{
            background: cta.style?.background,
            color: cta.style?.textColor,
            borderRadius: cta.style?.borderRadius,
            fontWeight: cta.style?.fontWeight,
          }}
          onMouseEnter={(e) => {
            if (cta.style?.hoverEffect) {
              e.currentTarget.style.background =
                cta.style.hoverEffect.background;
              e.currentTarget.style.color = cta.style.hoverEffect.textColor;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = cta.style?.background;
            e.currentTarget.style.color = cta.style?.textColor;
          }}
        >
          {cta.text}
        </button>
      )}
    </section>
  );
}
