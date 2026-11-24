import s from '@/features/v2/v2.module.css';

export default function V2Layout({ children }) {
  return (
    <div className={s.frame}>
      <div className={s.app}>{children}</div>
    </div>
  );
}
