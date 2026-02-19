export default function Contact({ data }: any) {
  const details = data.contactDetails;

  return (
    <section className="py-24 text-center">
      <h2 className="text-4xl font-bold mb-10">{data.headline}</h2>

      <div className="space-y-3 mb-10">
        <p>{details.phone}</p>
        <p>{details.email}</p>
        <p>{details.address}</p>
        <p>
          {details?.hours && (
            <>
              Open: {details.hours.open} – {details.hours.close}
            </>
          )}
        </p>
      </div>

      {data.cta && (
        <button
          className="px-8 py-4"
          style={{
            background: data.cta.style?.background,
            color: data.cta.style?.textColor,
            borderRadius: data.cta.style?.borderRadius,
          }}
        >
          {data.cta.text}
        </button>
      )}
    </section>
  );
}
