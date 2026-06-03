import { HomeDashboard } from "@/components/home/home-dashboard";
import { MobileShell } from "@/components/shell/mobile-shell";

export default function Page() {
  return (
    <MobileShell title="今日运势">
      <HomeDashboard />
    </MobileShell>
  );
}
