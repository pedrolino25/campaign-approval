import BenchmarkCard from "../cards/benchmark-card"
import TestimonialCard from "../cards/testimonial-card"

const TestimonialsSection = () => {
  return (
    <section className="container max-sm:px-0">
      <div className="max-w-[300px] lg:max-w-[400px] mx-auto">
        <h2 className="text-h3 lg:text-h2 text-center">What companies say about Worklient</h2>
      </div>
      <div className="pt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full grid grid-cols-2 gap-4">
          <BenchmarkCard value="3x" description="Faster approval cycles" />
          <BenchmarkCard value="90%" description="Less manual follow-ups" />
        </div>
        <TestimonialCard
          name="Elena Kovac"
          role="Chief Operating Officer"
          message="Version confusion is gone. Every comment is centralized, every decision logged, and nothing gets lost between iterations. It’s the first time our approval process actually feels scalable."
          variant="default"
        />
        <TestimonialCard
          name="Daniel Mercer"
          role="Marketing Director"
          message="Before worklient, campaign reviews lived across email threads and Slack messages. Now every asset moves through a defined workflow with full visibility. Our approval cycles are faster, and more importantly, predictable."
          variant="other"
        />
        <div className="w-full grid grid-cols-2 gap-4">
          <BenchmarkCard value="42%" description="Faster campaign launches" />
          <BenchmarkCard value="$18k" description="Savings from reduced delays" />
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection;