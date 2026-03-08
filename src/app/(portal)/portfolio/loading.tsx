import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function PortfolioLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '120px', marginBottom: '8px' }} />
        <SkeletonText width="220px" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '12px', width: '60%', marginBottom: '10px' }} />
            <Skeleton style={{ height: '26px', width: '45%' }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-[10px] p-5 mb-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '14px', width: '35%', marginBottom: '16px' }} />
        <Skeleton style={{ height: '200px' }} />
      </div>

      {/* Table */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <SkeletonText width="20%" height="13px" />
            <SkeletonText width="25%" height="13px" />
            <SkeletonText width="15%" height="13px" />
            <SkeletonText width="15%" height="13px" />
            <Skeleton style={{ height: '20px', width: '55px', borderRadius: '999px', marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
