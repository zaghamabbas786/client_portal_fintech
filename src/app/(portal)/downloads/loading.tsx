import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function DownloadsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '140px', marginBottom: '8px' }} />
        <SkeletonText width="280px" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} style={{ height: '32px', width: '90px', borderRadius: '8px' }} />
        ))}
      </div>

      {/* Grid of download cards */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-5 flex items-center gap-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
            <div className="flex-1 space-y-2">
              <SkeletonText width="80%" height="13px" />
              <SkeletonText width="50%" height="11px" />
            </div>
            <Skeleton style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
