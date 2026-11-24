/** 1234 → "1,234원" (Korean money format: no space before 원) */
export const won = value => `${Number(value || 0).toLocaleString('ko-KR')}원`;

/** Formats as the user types: 01012345678 → 010-1234-5678 */
export const formatPhoneInput = value => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

export const phoneDigits = value => String(value || '').replace(/\D/g, '');

/** "2026년 11월 21일 토요일" → "11월 21일 토요일" */
export const withoutYear = label => String(label || '').replace(/^\d{4}년\s*/, '');

/** "2026-11-21" → "2026년 11월 21일 토요일" */
export const dateLabel = value =>
  value
    ? new Date(`${value}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'Asia/Seoul',
      })
    : '';

/** "20:00" → "오후 8시" */
export const timeLabel = value => {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ` ${m}분` : ''}`;
};

const seoulParts = startsAt =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Asia/Seoul',
    })
      .formatToParts(new Date(startsAt))
      .map(part => [part.type, part.value])
  );

const WEEKDAY_KO = { Sun: '일', Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금', Sat: '토' };

/** session → "11.21 (토)" */
export const shortDate = session => {
  if (!session?.startsAt) return '';
  const p = seoulParts(session.startsAt);
  return `${Number(p.month)}.${Number(p.day)} (${WEEKDAY_KO[p.weekday]})`;
};

/** session → "11.21 오후 8시" (compact, for segmented controls) */
export const compactWhen = session => {
  if (!session?.startsAt) return '';
  const p = seoulParts(session.startsAt);
  return `${Number(p.month)}.${Number(p.day)} ${session.timeLabel}`;
};

/** session → "11월 21일 · 20:00" */
export const overviewWhen = session => {
  if (!session?.startsAt) return '';
  const p = seoulParts(session.startsAt);
  return `${Number(p.month)}월 ${Number(p.day)}일 · ${p.hour}:${p.minute}`;
};

export const dateTime = value => new Date(value).toLocaleString('ko-KR');
export const clockTime = value => new Date(value).toLocaleTimeString('ko-KR');

/** Picks 을/를 for the last syllable of a Korean word. */
export const objectParticle = text => {
  const code = (Array.from(text || '').at(-1) || '').charCodeAt(0);
  const hasFinal = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return hasFinal ? '을' : '를';
};

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
