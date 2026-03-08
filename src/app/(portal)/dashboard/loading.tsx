import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div>
      {/* Ticker bar skeleton */}
      <div className="rounded-[10px] px-4 py-3 mb-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '18px', width: '70%' }} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '12px', width: '60%', marginBottom: '10px' }} />
            <Skeleton style={{ height: '28px', width: '40%' }} />
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left column */}
        <div className="col-span-7 space-y-4">
          <div className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '14px', width: '35%', marginBottom: '16px' }} />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex gap-3">
                  <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                  <div className="flex-1 space-y-2">
                    <SkeletonText width="40%" />
                    <SkeletonText width="90%" />
                    <SkeletonText width="75%" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <Skeleton style={{ height: '13px', width: '55%', marginBottom: '12px' }} />
                <Skeleton style={{ height: '60px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-5 space-y-4">
          <div className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '14px', width: '50%', marginBottom: '16px' }} />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <Skeleton style={{ width: '22px', height: '16px', borderRadius: '4px' }} />
                <Skeleton style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                <Skeleton style={{ height: '13px', flex: 1 }} />
                <Skeleton style={{ height: '13px', width: '60px' }} />
              </div>
            ))}
          </div>

          <div className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderColor: 'rgba(212,175,55,0.3)' }}>
            <Skeleton style={{ height: '14px', width: '60%', marginBottom: '12px' }} />
            <Skeleton style={{ height: '80px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
