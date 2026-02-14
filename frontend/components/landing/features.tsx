import { BentoGridDemo } from "@/components/ui/demo";

export default function Features() {
  return (
    <section className="w-full px-4 pb-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-center">
          <p className="brand-heading text-xs text-foreground/70">
            Platform Capabilities
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Core Features of the Metascience Platform
          </h2>
        </div>
        <BentoGridDemo />
      </div>
    </section>
  );
}
