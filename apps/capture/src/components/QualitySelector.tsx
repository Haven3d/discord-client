import React from 'react';
import { QualityPreset } from '../services/media-capture';

interface QualitySelectorProps {
  value: QualityPreset;
  options: QualityPreset[];
  onChange: (preset: QualityPreset) => void;
  disabled: boolean;
}

export function QualitySelector({ value, options, onChange, disabled }: QualitySelectorProps) {
  return (
    <select
      value={value.label}
      onChange={(e) => {
        const selected = options.find(opt => opt.label === e.target.value);
        if (selected) onChange(selected);
      }}
      disabled={disabled}
      style={{ flex: 1 }}
    >
      {options.map((opt) => (
        <option key={opt.label} value={opt.label}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
