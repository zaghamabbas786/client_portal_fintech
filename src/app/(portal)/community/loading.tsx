import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function CommunityLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '160px', marginBottom: '8px' }} />
        <SkeletonText width="280px" />
      </div>

      {/* Create post box */}
      <div className="rounded-[10px] p-5 mb-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '80px', marginBottom: '12px' }} />
        <div className="flex gap-2">
          <Skeleton style={{ height: '32px', width: '140px', borderRadius: '8px' }} />
          <Skeleton style={{ height: '32px', width: '80px', borderRadius: '8px', marginLeft: 'auto' }} />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton style={{ height: '32px', width: '110px', borderRadius: '8px' }} />
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-[18px]" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
              <div className="flex-1 space-y-1.5">
                <SkeletonText width="120px" height="12px" />
                <SkeletonText width="80px" height="10px" />
              </div>
              <Skeleton style={{ height: '20px', width: '65px', borderRadius: '999px' }} />
            </div>
            <SkeletonText width="100%" height="13px" />
            <div className="mt-1.5">
              <SkeletonText width={`${65 + i * 7}%`} height="13px" />
            </div>
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Skeleton style={{ height: '14px', width: '40px', borderRadius: '6px' }} />
              <Skeleton style={{ height: '14px', width: '40px', borderRadius: '6px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
