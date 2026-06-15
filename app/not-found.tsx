import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.shell}>
      <SiteHeader />
      <main className={styles.main}>
        <div>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>This page does not exist.</h1>
          <p className={styles.text}>The game or page you are looking for is not here.</p>
          <Link href="/#explore" className={styles.cta}>
            Browse the benchmarks →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
