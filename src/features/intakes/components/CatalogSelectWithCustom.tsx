import { type ChangeEvent } from 'react';
import type { LookupOption } from '../types';

type CatalogSelectWithCustomProps = {
  value: string;
  customValue: string;
  options: LookupOption[];
  placeholder: string;
  customPlaceholder: string;
  customOptionLabel?: string;
  onValueChange: (value: string) => void;
  onCustomValueChange: (value: string) => void;
};

const CUSTOM_OPTION_VALUE = '__custom__';

export function CatalogSelectWithCustom({
  value,
  customValue,
  options,
  placeholder,
  customPlaceholder,
  customOptionLabel = 'Otro (escribir manual)',
  onValueChange,
  onCustomValueChange,
}: CatalogSelectWithCustomProps) {
  const selectValue = customValue ? CUSTOM_OPTION_VALUE : value;

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextValue = event.target.value;
    if (nextValue === CUSTOM_OPTION_VALUE) {
      onValueChange('');
      return;
    }
    onValueChange(nextValue);
    onCustomValueChange('');
  }

  return (
    <div className="space-y-2">
      <select className="input h-14 text-base" value={selectValue} onChange={handleSelectChange}>
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        <option value={CUSTOM_OPTION_VALUE}>{customOptionLabel}</option>
      </select>

      {selectValue === CUSTOM_OPTION_VALUE ? (
        <input
          className="input h-12 text-base"
          placeholder={customPlaceholder}
          value={customValue}
          onChange={(event) => onCustomValueChange(event.target.value)}
        />
      ) : null}
    </div>
  );
}
