'use client';

// Shared UI kit following the Toss design ruleset. Both versions build on these.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import s from './ui.module.css';
import { AlertIcon, CheckIcon, ChevronRightIcon, KakaoIcon, XIcon } from './icons';

const cx = (...names) => names.filter(Boolean).join(' ');

// ---------------------------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------------------------

export function Dots() {
  return (
    <span className={s.dots} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Loader({ label = '불러오는 중' }) {
  return (
    <div className={s.loaderBlock} role="status">
      <Dots />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * variant: primary (one per screen) | secondary | danger | ghost | dangerGhost | kakao
 * size: xl | l | m | s. Pass href to render a link.
 */
export function Button({ variant = 'primary', size = 'l', full, loading, href, className, children, ...props }) {
  const classes = cx(s.btn, s[size], s[variant], full && s.full, loading && s.loading, className);
  const content = (
    <>
      {variant === 'kakao' && <KakaoIcon />}
      <span className={s.label}>{children}</span>
      {loading && <Dots />}
    </>
  );
  if (href) {
    const external = /^https?:/.test(href);
    return external ? (
      <a className={classes} href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    ) : (
      <Link className={classes} href={href} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} type="button" disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}

export function IconButton({ label, spinning, className, children, ...props }) {
  return (
    <button type="button" className={cx(s.iconBtn, spinning && s.spin, className)} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------------------------

export function TextField({ label, error, help, as = 'input', className, children, inputRef, ...props }) {
  const autoId = useId();
  const id = props.id || autoId;
  const Tag = as;
  return (
    <div className={cx(s.field, className)}>
      {label && (
        <label className={s.fieldLabel} htmlFor={id}>
          {label}
        </label>
      )}
      <Tag
        id={id}
        ref={inputRef}
        className={s.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || help ? `${id}-note` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {(error || help) && (
        <span id={`${id}-note`} className={error ? s.error : s.help} aria-live="polite">
          {error || help}
        </span>
      )}
    </div>
  );
}

export function Checkbox({ children, className, ...props }) {
  return (
    <label className={cx(s.check, className)}>
      <input type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  );
}

export function Switch({ checked, onChange, children, ...props }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={s.switch} onClick={() => onChange(!checked)} {...props}>
      <span className={s.track} aria-hidden="true" />
      {children}
    </button>
  );
}

/** Multi-select filter chip (aria-pressed) */
export function Chip({ selected, brand, className, children, ...props }) {
  return (
    <button type="button" aria-pressed={brand ? undefined : Boolean(selected)} className={cx(s.chip, brand && s.chipBrand, className)} {...props}>
      {children}
    </button>
  );
}

/** Mutually exclusive choice. options: [{ value, label, sub? }] */
export function SegmentedControl({ options, value, onChange, label, className }) {
  return (
    <div className={cx(s.segmented, className)} role="radiogroup" aria-label={label}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={s.segment}
          onClick={() => option.value !== value && onChange(option.value)}
        >
          {option.label}
          {option.sub && <small>{option.sub}</small>}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = 'grey', children }) {
  return <span className={cx(s.badge, s[`tone-${tone}`])}>{children}</span>;
}

// ---------------------------------------------------------------------------------------------
// Overlays
// ---------------------------------------------------------------------------------------------

/**
 * Centered dialog on desktop, bottom sheet on mobile.
 * dismissible=false keeps it open on backdrop click (admin forms).
 */
export function Dialog({ title, onClose, dismissible = true, wide, className, children }) {
  const titleId = useId();
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = event => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return (
    <div className={s.scrim} onMouseDown={event => dismissible && event.target === event.currentTarget && onClose()}>
      <section
        ref={panel}
        tabIndex={-1}
        className={cx(s.dialog, wide && s.wide, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <button className={s.close} type="button" aria-label="닫기" onClick={onClose}>
          <XIcon size={22} />
        </button>
        {title && (
          <h2 id={titleId} className={s.dialogTitle}>
            {title}
          </h2>
        )}
        {children}
      </section>
    </div>
  );
}

/** Confirm dialog: returns via onConfirm / onClose. */
export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title={title} onClose={onClose}>
      <p className={s.dialogBody}>{body}</p>
      <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
        <Button
          variant={danger ? 'danger' : 'primary'}
          full
          loading={busy}
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" full onClick={onClose}>
          닫기
        </Button>
      </div>
    </Dialog>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={s.toast} role="status">
      <span className={cx(s.toastIcon, toast.error && s.toastError)} aria-hidden="true">
        {toast.error ? <AlertIcon size={16} /> : <CheckIcon size={14} strokeWidth="2.4" />}
      </span>
      {toast.message}
    </div>
  );
}

/** const [toast, notify] = useToast(); notify('저장했어요') / notify('실패했어요', { error: true }) */
export function useToast(duration = 2400) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const notify = useCallback(
    (message, options = {}) => {
      clearTimeout(timer.current);
      setToast({ message, ...options });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, notify];
}

// ---------------------------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------------------------

/** Fixed bottom action with the white protective gradient. info renders a pill above it. */
export function BottomCTA({ info, children }) {
  return (
    <div className={s.bottomCta}>
      <div className={s.bottomCtaInner}>
        {info && <span className={s.bottomInfo}>{info}</span>}
        {children}
      </div>
    </div>
  );
}

export function ListRow({ title, sub, right, left, href, onClick, arrow, className }) {
  const body = (
    <>
      {left}
      <span className={s.rowText}>
        <span className={s.rowTitle}>{title}</span>
        {sub && <span className={s.rowSub}>{sub}</span>}
      </span>
      {(right || arrow) && (
        <span className={s.rowRight}>
          {right}
          {arrow && <ChevronRightIcon size={20} />}
        </span>
      )}
    </>
  );
  if (href)
    return /^https?:/.test(href) ? (
      <a className={cx(s.listRow, className)} href={href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    ) : (
      <Link className={cx(s.listRow, className)} href={href}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" className={cx(s.listRow, className)} onClick={onClick}>
        {body}
      </button>
    );
  return <div className={cx(s.listRow, className)}>{body}</div>;
}

export function ProgressBar({ value, max, label }) {
  return (
    <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <span style={{ width: `${Math.min(100, (value / max) * 100 || 0)}%` }} />
    </div>
  );
}

/** steps: string[]; progress: { current, doneUntil } (1-based) */
export function StepIndicator({ steps, progress, label }) {
  return (
    <ol className={s.stepper} aria-label={label}>
      {steps.map((title, index) => {
        const step = index + 1;
        const done = step <= progress.doneUntil;
        const current = step === progress.current;
        return (
          <li key={title} className={cx(s.step, done && s.stepDone, current && s.stepCurrent)} aria-current={current ? 'step' : undefined}>
            <span className={s.node}>{done ? <CheckIcon size={14} strokeWidth="2.4" /> : step}</span>
            {title}
          </li>
        );
      })}
    </ol>
  );
}
