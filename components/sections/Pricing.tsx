export default function Pricing({ data }: any) {
  return (
    <section className="py-24">
      <h2 className="text-4xl font-bold mb-12 text-center">{data.headline}</h2>

      <div className="grid md:grid-cols-3 gap-8">
        {data.pricingOptions?.map((plan: any, i: number) => (
          <div
            key={i}
            className="p-8 rounded-xl border"
            style={{
              background: plan.style?.background,
              color: plan.style?.textColor,
              borderColor: plan.style?.borderColor,
            }}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

            <p className="text-xl mb-4">{plan.price}</p>

            <p className="text-sm mb-6 opacity-70">{plan.description}</p>

            <ul className="space-y-2 mb-6">
              {plan.features?.map((f: string, idx: number) => (
                <li key={idx}>• {f}</li>
              ))}
            </ul>

            <button className="px-4 py-2 bg-white text-black rounded-lg">
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
