import { ChevronDown } from "lucide-react";

interface CustomSelectProps<T extends string> {
  label?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  className?: string;
}

export function CustomSelect<T extends string>({ label, value, options, onChange, className = "" }: CustomSelectProps<T>) {
  return (
    <label className={`custom-select ${className}`}>
      {label ? <span>{label}</span> : null}
      <div className="custom-select__control">
        <select value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown size={14} />
      </div>
    </label>
  );
}
