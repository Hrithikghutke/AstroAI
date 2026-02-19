import Section from "@/components/ui/Section";
import { H2 } from "@/components/ui/Typography";

export default function Testimonials({ data }: any) {
  return (
    <Section>
      <H2>{data.headline}</H2>
      <div className="space-y-6">
        {data.testimonials?.map((t: any, i: number) => (
          <div
            key={i}
            className="p-6 rounded-xl border-l-4"
            style={{
              borderColor: t.style?.accentColor,
            }}
          >
            <p className="mb-3">{t.review}</p>
            <p className="font-semibold">{t.name}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
