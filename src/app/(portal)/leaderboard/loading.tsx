import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function LeaderboardLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '180px', marginBottom: '8px' }} />
        <SkeletonText width="240px" />
      </div>

      {/* Month filter row */}
      <div className="flex items-center justify-between mb-5">
        <Skeleton style={{ height: '32px', width: '130px', borderRadius: '8px' }} />
        <Skeleton style={{ height: '20px', width: '200px', borderRadius: '8px' }} />
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-5 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 10px' }} />
            <SkeletonText width="70%" height="13px" />
            <div className="mt-2"><SkeletonText width="50%" height="20px" /></div>
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <Skeleton style={{ width: '28px', height: '16px', borderRadius: '4px' }} />
            <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
            <Skeleton style={{ height: '13px', flex: 1 }} />
            <Skeleton style={{ height: '13px', width: '70px' }} />
            <Skeleton style={{ height: '13px', width: '60px' }} />
            <Skeleton style={{ height: '13px', width: '80px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
