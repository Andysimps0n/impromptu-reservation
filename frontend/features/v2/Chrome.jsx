'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dialog, IconButton } from '@/components/ui';
import { BackIcon } from '@/components/ui/icons';
import { PrivacyPolicy } from '@/components/shared/PrivacyPolicy';
import { INSTAGRAM_URL, OPEN_CHAT_URL, SITE_NAME } from '@/lib/content';
import s from './v2.module.css';

/** 56px top bar. back: href string or function. Without back, shows the brand. */
export function TopBar({ title, back, right, children }) {
  const router = useRouter();
  return (
    <div className={s.top}>
      <div className={s.topBar}>
        {back ? (
          <IconButton label="뒤로" onClick={() => (typeof back === 'function' ? back() : router.push(back))}>
            <BackIcon />
          </IconButton>
        ) : (
          <Link href="/v2" className={s.brand}>
            <Image src="/logo.png" alt="" width={28} height={28} />
            {!title && SITE_NAME}
          </Link>
        )}
        {title && <h1 className={s.topTitle}>{title}</h1>}
        {!title && <span style={{ flex: 1 }} />}
        {right}
      </div>
      {children}
    </div>
  );
}

const BOOKING_TABS = [
  { href: '/v2/booking/seats', label: '좌석 예매' },
  { href: '/v2/booking/guide', label: '예매 안내' },
  { href: '/v2/booking/lookup', label: '예약 조회' },
];

/** Link tabs for the audience booking area. */
export function BookingTabs() {
  const path = usePathname();
  return (
    <nav className={s.tabs} aria-label="예매 메뉴">
      {BOOKING_TABS.map(tab => (
        <Link key={tab.href} href={tab.href} className={s.tab} aria-current={path === tab.href ? 'page' : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** In-page tabs (admin). tabs: [{ value, label }] */
export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {tabs.map(tab => (
        <button key={tab.value} type="button" role="tab" aria-selected={tab.value === value} className={s.tab} onClick={() => onChange(tab.value)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Footer() {
  const [privacy, setPrivacy] = useState(false);
  return (
    <footer className={s.footer}>
      <span>2026 즉흥적 새벽 두 시 · How’d you feel?</span>
      <span className={s.footerLinks}>
        <button type="button" onClick={() => setPrivacy(true)}>
          개인정보 처리방침
        </button>
        <Link href="/v2/admin">운영자 로그인</Link>
        <a href={OPEN_CHAT_URL} target="_blank" rel="noopener noreferrer">
          카카오톡 문의
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          인스타그램
        </a>
      </span>
      {privacy && (
        <Dialog title="개인정보 처리방침" wide onClose={() => setPrivacy(false)}>
          <PrivacyPolicy />
        </Dialog>
      )}
    </footer>
  );
}
