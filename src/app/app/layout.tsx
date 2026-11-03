import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { ja } from "@/lib/i18n/ja";
import { BranchHost } from "./_parts/BranchHost";
import { CountOpen } from "./_parts/CountOpen";
import { SyncOnce } from "./_parts/SyncOnce";
import styles from "./app.module.css";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className={styles.shell}>
      <BranchHost>
        <main className={styles.main}>{children}</main>
      </BranchHost>
      <BottomNav labels={ja.nav} brand={<Logo size="sm" href="/" />} />
      <SyncOnce />
      <CountOpen />
    </div>
  );
}
