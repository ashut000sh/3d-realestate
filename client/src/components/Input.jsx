// Shared form fields with label, hint and error message.
// <Input label="Email" type="email" icon="mail" error={errors.email} value={email} onChange={...} />
// <Textarea label="Message" rows={4} ... />   <Select label="District">{options}</Select>
import Icon from "./Icon.jsx";

function Field({ label, hint, error, id, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-sm text-danger">
          <Icon name="alert" className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

export default function Input({ label, hint, error, id, icon, right, className = "", ...props }) {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-muted"
          />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`field ${icon ? "pl-10" : ""} ${right ? "pr-11" : ""} ${error ? "field-error" : ""}`}
          {...props}
        />
        {right && <div className="absolute top-1/2 right-2 -translate-y-1/2">{right}</div>}
      </div>
    </Field>
  );
}

export function Textarea({ label, hint, error, id, className = "", ...props }) {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`field min-h-24 resize-y ${error ? "field-error" : ""}`}
        {...props}
      />
    </Field>
  );
}

export function Select({ label, hint, error, id, className = "", children, ...props }) {
  const inputId = id ?? props.name;
  return (
    <Field label={label} hint={hint} error={error} id={inputId} className={className}>
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`field appearance-none pr-10 ${error ? "field-error" : ""}`}
          {...props}
        >
          {children}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </div>
    </Field>
  );
}
