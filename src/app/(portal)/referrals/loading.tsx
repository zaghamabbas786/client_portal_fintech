import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function ReferralsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '130px', marginBottom: '8px' }} />
        <SkeletonText width="250px" />
      </div>

      {/* Referral link card */}
      <div className="rounded-[10px] p-6 mb-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '13px', width: '40%', marginBottom: '12px' }} />
        <div className="flex gap-3">
          <Skeleton style={{ height: '40px', flex: 1, borderRadius: '8px' }} />
          <Skeleton style={{ height: '40px', width: '100px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '12px', width: '60%', marginBottom: '10px' }} />
            <Skeleton style={{ height: '28px', width: '45%' }} />
          </div>
        ))}
      </div>

      {/* Referral history */}
      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Skeleton style={{ height: '14px', width: '40%' }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <SkeletonText width="35%" height="13px" />
            <SkeletonText width="20%" height="13px" />
            <Skeleton style={{ height: '20px', width: '60px', borderRadius: '999px', marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
