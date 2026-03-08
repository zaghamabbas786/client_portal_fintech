import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

export default function MyEAsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '120px', marginBottom: '8px' }} />
        <SkeletonText width="260px" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-[10px] p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            {/* EA logo/icon area */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
              <Skeleton style={{ height: '22px', width: '60px', borderRadius: '999px' }} />
            </div>
            {/* EA name */}
            <Skeleton style={{ height: '16px', width: '75%', marginBottom: '6px' }} />
            <SkeletonText width="55%" height="12px" />

            {/* Divider */}
            <div className="my-4" style={{ borderTop: '1px solid var(--border)' }} />

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <SkeletonText width="40%" height="12px" />
                <SkeletonText width="30%" height="12px" />
              </div>
              <div className="flex justify-between">
                <SkeletonText width="50%" height="12px" />
                <SkeletonText width="25%" height="12px" />
              </div>
            </div>

            {/* Button */}
            <Skeleton style={{ height: '34px', marginTop: '16px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
