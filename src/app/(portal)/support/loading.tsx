import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function SupportLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '130px', marginBottom: '8px' }} />
        <SkeletonText width="250px" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left: ticket form */}
        <div className="col-span-7">
          <div className="rounded-[10px] p-6" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '14px', width: '45%', marginBottom: '20px' }} />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <Skeleton style={{ height: '12px', width: '30%', marginBottom: '8px' }} />
                  <Skeleton style={{ height: '40px', borderRadius: '8px' }} />
                </div>
              ))}
              <div>
                <Skeleton style={{ height: '12px', width: '30%', marginBottom: '8px' }} />
                <Skeleton style={{ height: '100px', borderRadius: '8px' }} />
              </div>
              <Skeleton style={{ height: '38px', width: '140px', borderRadius: '8px' }} />
            </div>
          </div>
        </div>

        {/* Right: ticket list */}
        <div className="col-span-5">
          <div className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '14px', width: '50%', marginBottom: '16px' }} />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-[8px]" style={{ background: 'var(--bg-3)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <SkeletonText width="55%" height="13px" />
                    <Skeleton style={{ height: '18px', width: '50px', borderRadius: '999px' }} />
                  </div>
                  <SkeletonText width="35%" height="11px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
