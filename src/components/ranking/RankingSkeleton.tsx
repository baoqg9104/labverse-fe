
export default function RankingSkeleton() {
  return (
    <ol>
      {Array.from({ length: 10 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
          <div className="w-12 text-right">
            <div className="h-4 w-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            <div>
              <div className="h-4 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-6">
            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ol>
  );
}
