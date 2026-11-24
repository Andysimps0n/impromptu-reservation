'use client';

import { useRef, useState } from 'react';
import { Checkbox, IconButton, TextField } from '@/components/ui';
import { CopyIcon } from '@/components/ui/icons';
import { ACCOUNT_BANK, ACCOUNT_NUMBER, PRIVACY_CONSENT_REASON } from '@/lib/content';
import { copyText, formatPhoneInput, phoneDigits } from '@/lib/format';
import s from './shared.module.css';

const validate = (field, value) => {
  const text = value.trim();
  const digits = phoneDigits(text);
  if (field === 'name' && !text) return '예매자 이름을 입력해 주세요.';
  if (field === 'payer' && !text) return '실제로 입금할 분의 이름을 입력해 주세요.';
  if ((field === 'name' || field === 'payer') && text.length > 40) return '40자 안으로 입력해 주세요.';
  if (field === 'phone' && !text) return '연락처를 입력해 주세요. 예: 010-1234-5678';
  if (field === 'phone' && (digits.length < 10 || digits.length > 11)) return '연락처 숫자를 10~11자리로 입력해 주세요.';
  if (field === 'phoneConfirm' && !text) return '확인을 위해 연락처를 한 번 더 입력해 주세요.';
  return '';
};

/** Bank account line with a copy button. */
export function AccountBox({ onCopied }) {
  return (
    <div className={s.account}>
      <div className={s.accountText}>
        <span>{ACCOUNT_BANK}</span>
        <strong>{ACCOUNT_NUMBER}</strong>
      </div>
      <IconButton
        label="계좌번호 복사"
        onClick={async () => {
          const ok = await copyText(ACCOUNT_NUMBER);
          onCopied?.(ok ? '계좌번호를 복사했어요' : '복사하지 못했어요. 계좌번호를 길게 눌러 복사해 주세요.', !ok);
        }}
      >
        <CopyIcon size={20} />
      </IconButton>
    </div>
  );
}

/**
 * Name / phone / phone confirm / payer / privacy consent.
 * renderSubmit({ busy, disabled }) draws the submit button so each layout can place it.
 */
export function BookingForm({ onSubmit, renderSubmit, id = 'booking-form' }) {
  const [values, setValues] = useState({ name: '', phone: '', phoneConfirm: '', payer: '' });
  const [payerSame, setPayerSame] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const payerInput = useRef(null);
  const mismatch = values.phoneConfirm.trim() !== '' && phoneDigits(values.phone) !== phoneDigits(values.phoneConfirm);

  const change = (field, value) => {
    setValues(v => ({ ...v, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: validate(field, value) }));
  };
  const blur = field => event => setErrors(e => ({ ...e, [field]: validate(field, event.target.value) }));

  const submit = async event => {
    event.preventDefault();
    const next = {
      name: validate('name', values.name),
      phone: validate('phone', values.phone),
      phoneConfirm: validate('phoneConfirm', values.phoneConfirm),
      payer: payerSame ? '' : validate('payer', values.payer),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || mismatch) return;
    if (!privacy) {
      setFormError('개인정보 수집에 동의해 주세요.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      await onSubmit({
        name: values.name.trim(),
        phone: values.phone.trim(),
        payer: (payerSame ? values.name : values.payer).trim(),
      });
    } catch (problem) {
      setFormError(problem.message);
      setBusy(false);
    }
  };

  return (
    <form id={id} className={s.form} noValidate onSubmit={submit}>
      <TextField
        label="예매자 이름"
        name="name"
        autoComplete="name"
        maxLength={40}
        placeholder="예: 홍길동"
        value={values.name}
        error={errors.name}
        onChange={e => change('name', e.target.value)}
        onBlur={blur('name')}
      />
      <TextField
        label="연락처"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={13}
        placeholder="예: 010-1234-5678"
        value={values.phone}
        error={errors.phone}
        onChange={e => change('phone', formatPhoneInput(e.target.value))}
        onBlur={blur('phone')}
      />
      <TextField
        label="연락처 확인"
        name="phoneConfirm"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        maxLength={13}
        placeholder="연락처를 한 번 더 입력해 주세요"
        value={values.phoneConfirm}
        error={errors.phoneConfirm || (mismatch ? '연락처가 서로 달라요. 다시 확인해 주세요.' : '')}
        onChange={e => change('phoneConfirm', formatPhoneInput(e.target.value))}
        onBlur={blur('phoneConfirm')}
      />
      <Checkbox
        checked={payerSame}
        onChange={e => {
          setPayerSame(e.target.checked);
          if (e.target.checked) setErrors(x => ({ ...x, payer: '' }));
          else requestAnimationFrame(() => payerInput.current?.focus());
        }}
      >
        예매자와 입금자가 같아요
      </Checkbox>
      {!payerSame && (
        <TextField
          label="입금자명"
          name="payer"
          autoComplete="name"
          maxLength={40}
          placeholder="예: 홍길동"
          inputRef={payerInput}
          value={values.payer}
          error={errors.payer}
          onChange={e => change('payer', e.target.value)}
          onBlur={blur('payer')}
        />
      )}
      <div className={s.consent}>
        <Checkbox checked={privacy} onChange={e => setPrivacy(e.target.checked)}>
          개인정보 수집에 동의해요
        </Checkbox>
        <p>{PRIVACY_CONSENT_REASON}</p>
      </div>
      {formError && (
        <div className={s.formError} role="alert">
          {formError}
        </div>
      )}
      {renderSubmit({ busy, disabled: mismatch })}
    </form>
  );
}
