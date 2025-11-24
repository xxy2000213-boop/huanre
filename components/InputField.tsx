import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: number;
  unit?: string;
  step?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  unit,
  step = "0.01",
  onChange,
  description
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {unit && <span className="text-xs font-mono text-slate-400">{unit}</span>}
      </div>
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400
        focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
        disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
      />
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </div>
  );
};