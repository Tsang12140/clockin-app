import BottomNav from '@/components/BottomNav';
import AIAssistant from '@/components/AIAssistant';
import { getSession } from '@/lib/session';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const aiUserKey = session.userId || session.userPhone || 'anonymous';

  return (
    <div className="min-h-full bg-[#F0F4FA]">
      <BottomNav />
      <main className="pb-20 md:pb-0 md:pt-[72px]">{children}</main>
      <AIAssistant userKey={aiUserKey} />
    </div>
  );
}
