type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({ eyebrow, title, description, align = "left", light = false }: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      <p className={light ? "eyebrow text-gold-400" : "eyebrow"}>
        <span aria-hidden="true" className="mr-3 inline-block h-px w-8 bg-current align-middle opacity-50" />
        {eyebrow}
      </p>
      <h2
        className={`section-title mt-5 text-[2.15rem] leading-[1.08] sm:text-5xl lg:text-[3.45rem] ${light ? "text-white" : "text-ink-950"}`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-6 max-w-3xl text-base leading-8 sm:text-lg ${align === "center" ? "mx-auto" : ""} ${light ? "text-white/62" : "text-slate-600"}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
