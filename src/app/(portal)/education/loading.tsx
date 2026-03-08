import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function EducationLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '150px', marginBottom: '8px' }} />
        <SkeletonText width="260px" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} style={{ height: '32px', width: '100px', borderRadius: '8px' }} />
        ))}
      </div>

      {/* Featured video */}
      <div className="rounded-[10px] overflow-hidden mb-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '240px', borderRadius: '0' }} />
        <div className="p-5">
          <Skeleton style={{ height: '16px', width: '60%', marginBottom: '8px' }} />
          <SkeletonText width="85%" />
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '130px', borderRadius: '0' }} />
            <div className="p-4 space-y-2">
              <SkeletonText width="90%" height="13px" />
              <SkeletonText width="60%" height="11px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
