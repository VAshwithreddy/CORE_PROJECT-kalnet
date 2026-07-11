/**
 * FormControls
 *
 * Complete set of CORE design system form primitives.
 * Every input must have a visible label. Helper and error text are
 * linked to inputs via aria attributes for screen reader support.
 *
 * Exports:
 *   TextInput      – single-line text, email, password, number
 *   TextArea       – multi-line text
 *   SelectInput    – styled native select
 *   CheckboxInput  – accessible checkbox with label
 *   RadioGroup     – accessible radio button group
 *   FormSection    – visual grouping with heading + description
 *   FormActions    – footer action row
 *   FieldError     – standalone error message
 *   FormErrorSummary – top-of-form error list
 */

import { useId, type ChangeEvent, type ReactNode } from "react";

// ─── TextInput ───────────────────────────────────────────────────────────────

interface TextInputProps {
  id?: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "search" | "tel" | "url";
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function TextInput({
  id,
  label,
  type = "text",
  value,
  defaultValue,
  placeholder,
  helper,
  error,
  required,
  disabled,
  readOnly,
  autoComplete,
  onChange,
  className = "",
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const ariaDescribedBy = [helper ? helperId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-label" htmlFor={inputId}>
        {label}
        {required && <span className="form-label__required" aria-hidden="true"> *</span>}
      </label>

      {helper && (
        <p id={helperId} className="form-helper">
          {helper}
        </p>
      )}

      <input
        id={inputId}
        type={type}
        className={`form-input${error ? " form-input--error" : ""}`}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? "true" : undefined}
        aria-required={required}
        onChange={onChange}
      />

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── TextArea ────────────────────────────────────────────────────────────────

interface TextAreaProps {
  id?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

export function TextArea({
  id,
  label,
  value,
  defaultValue,
  placeholder,
  helper,
  error,
  required,
  disabled,
  rows = 4,
  maxLength,
  onChange,
  className = "",
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const ariaDescribedBy = [helper ? helperId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-label" htmlFor={inputId}>
        {label}
        {required && <span className="form-label__required" aria-hidden="true"> *</span>}
      </label>

      {helper && (
        <p id={helperId} className="form-helper">
          {helper}
        </p>
      )}

      <textarea
        id={inputId}
        className={`form-textarea${error ? " form-input--error" : ""}`}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? "true" : undefined}
        aria-required={required}
        onChange={onChange}
      />

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── SelectInput ─────────────────────────────────────────────────────────────

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectInputProps {
  id?: string;
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export function SelectInput({
  id,
  label,
  options,
  value,
  defaultValue,
  placeholder,
  helper,
  error,
  required,
  disabled,
  onChange,
  className = "",
}: SelectInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const ariaDescribedBy = [helper ? helperId : "", error ? errorId : ""]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      <label className="form-label" htmlFor={inputId}>
        {label}
        {required && <span className="form-label__required" aria-hidden="true"> *</span>}
      </label>

      {helper && (
        <p id={helperId} className="form-helper">
          {helper}
        </p>
      )}

      <select
        id={inputId}
        className={`form-select${error ? " form-input--error" : ""}`}
        value={value}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? "true" : undefined}
        aria-required={required}
        onChange={onChange}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── CheckboxInput ────────────────────────────────────────────────────────────

interface CheckboxInputProps {
  id?: string;
  label: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function CheckboxInput({
  id,
  label,
  checked,
  defaultChecked,
  helper,
  error,
  required,
  disabled,
  onChange,
  className = "",
}: CheckboxInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`form-field ${className}`.trim()}>
      <div className="form-checkbox-row">
        <input
          id={inputId}
          type="checkbox"
          className="form-checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          required={required}
          disabled={disabled}
          aria-describedby={[helper ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? "true" : undefined}
          onChange={onChange}
        />
        <label className="form-checkbox-label" htmlFor={inputId}>
          {label}
          {required && <span className="form-label__required" aria-hidden="true"> *</span>}
        </label>
      </div>

      {helper && (
        <p id={helperId} className="form-helper" style={{ marginTop: 4 }}>
          {helper}
        </p>
      )}

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── RadioGroup ──────────────────────────────────────────────────────────────

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  legend,
  name,
  options,
  value,
  defaultValue,
  helper,
  error,
  required,
  onChange,
  className = "",
}: RadioGroupProps) {
  const groupId = useId();
  const helperId = `${groupId}-helper`;
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className={`form-field ${className}`.trim()}
      aria-describedby={[helper ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined}
      style={{ border: "none", padding: 0, margin: 0 }}
    >
      <legend className="form-label" style={{ marginBottom: 8 }}>
        {legend}
        {required && <span className="form-label__required" aria-hidden="true"> *</span>}
      </legend>

      {helper && (
        <p id={helperId} className="form-helper">
          {helper}
        </p>
      )}

      <div className="form-radio-group">
        {options.map((opt) => {
          const optId = `${groupId}-${opt.value}`;
          return (
            <div key={opt.value} className="form-radio-row">
              <input
                id={optId}
                type="radio"
                name={name}
                value={opt.value}
                className="form-radio"
                checked={value !== undefined ? value === opt.value : undefined}
                defaultChecked={defaultValue !== undefined ? defaultValue === opt.value : undefined}
                disabled={opt.disabled}
                aria-describedby={opt.description ? `${optId}-desc` : undefined}
                onChange={() => onChange?.(opt.value)}
              />
              <div>
                <label className="form-radio-label" htmlFor={optId}>
                  {opt.label}
                </label>
                {opt.description && (
                  <p id={`${optId}-desc`} className="form-radio-description">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

// ─── FormSection ─────────────────────────────────────────────────────────────

interface FormSectionProps {
  heading: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ heading, description, children, className = "" }: FormSectionProps) {
  return (
    <div className={`form-section ${className}`.trim()}>
      <h2 className="form-section__heading">{heading}</h2>
      {description && (
        <p className="form-section__description">{description}</p>
      )}
      {children}
    </div>
  );
}

// ─── FormActions ──────────────────────────────────────────────────────────────

interface FormActionsProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  loading?: boolean;
  align?: "left" | "right";
  className?: string;
}

export function FormActions({
  primaryLabel = "Save",
  secondaryLabel = "Cancel",
  onPrimary,
  onSecondary,
  primaryDisabled,
  loading,
  align = "left",
  className = "",
}: FormActionsProps) {
  return (
    <div
      className={`form-actions${align === "right" ? " form-actions--right" : ""} ${className}`.trim()}
    >
      {onSecondary && (
        <button type="button" className="core-button" onClick={onSecondary} disabled={loading}>
          {secondaryLabel}
        </button>
      )}
      <button
        type="submit"
        className="core-button core-button-primary"
        onClick={onPrimary}
        disabled={primaryDisabled || loading}
        aria-busy={loading}
      >
        {loading ? "Saving…" : primaryLabel}
      </button>
    </div>
  );
}

// ─── FieldError ───────────────────────────────────────────────────────────────

interface FieldErrorProps {
  id?: string;
  message?: string;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="form-error" role="alert">
      {message}
    </p>
  );
}

// ─── FormErrorSummary ─────────────────────────────────────────────────────────

interface FormErrorSummaryProps {
  errors: string[];
  title?: string;
}

export function FormErrorSummary({
  errors,
  title = "Please fix the following errors before continuing",
}: FormErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <div className="form-error-summary" role="alert" aria-live="assertive">
      <p className="form-error-summary__title">{title}</p>
      <ul className="form-error-summary__list">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
