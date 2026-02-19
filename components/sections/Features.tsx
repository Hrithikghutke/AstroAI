import Section from "@/components/ui/Section";
import { H2, Paragraph } from "@/components/ui/Typography";

export default function Features({ data }: any) {
  return (
    <Section>
      <H2>{data.headline}</H2>

      {data.description && (
        <div className="mb-10">
          <Paragraph>{data.description}</Paragraph>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {data.features?.map((feature: any, i: number) => (
          <div key={i} className="p-6 border border-neutral-800 rounded-xl">
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-neutral-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
