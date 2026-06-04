import React, { useEffect, useRef, useState } from 'react';

type FieldError = { field: string; message: string };

type Props = {
  id: string;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  children: React.ReactNode;
  errors?: FieldError[];
  ariaDescribedBy?: string;
};

export function AccessibleForm({ id, onSubmit, children, errors = [], ariaDescribedBy }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0 && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errors]);

  return (
    <form
      id={id}
      aria-describedby={ariaDescribedBy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        const data: Record<string, any> = {};
        fd.forEach((v, k) => (data[k] = v));
        try {
          await onSubmit(data);
        } finally {
          setSubmitting(false);
        }
      }}
      role="form"
      noValidate
      ref={formRef}
    >
      {errors.length > 0 && (
        <div
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          ref={errorRef}
        >
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                <a href={`#${id}-${e.field}`}>{e.message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children}
      <div>
        <button type="submit" aria-busy={submitting} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
