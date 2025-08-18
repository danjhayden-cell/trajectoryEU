import { TrajectoryCompare } from '@/components/trajectory-compare';

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Clean, focused interface - chart immediately above the fold */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TrajectoryCompare />
      </div>
    </div>
  );
}
