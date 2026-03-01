interface BenchmarkCardProps {
  value: string
  description: string
}
const BenchmarkCard = ({ value, description }: BenchmarkCardProps) => {
  return (
    <div className="bg-gray-50 rounded-md p-2 border border-gray-200 min-h-[180px] h-full">
      <div className="bg-white rounded-sm py-[14px] px-[12px] border border-gray-200 flex flex-col gap-2 items-start">
        <h2 className="text-h2">{value}</h2>
        <p className="text-body text-black/50">{description}</p>
      </div>
    </div>
  )
}

export default BenchmarkCard
