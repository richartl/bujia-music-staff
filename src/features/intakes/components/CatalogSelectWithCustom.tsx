import { type ChangeEvent } from 'react';
import type { LookupOption } from '../types';

type CatalogSelectWithCustomProps = {
  value: string;
  options: LookupOption[];
  placeholder: string;
  createOptionLabel?: string;
  onValueChange: (value: string) => void;
  onCreateOption: () => void;
};

const CUSTOM_OPTION_VALUE = '__custom__';

export function CatalogSelectWithCustom({
  value,
  options,
  placeholder,
  createOptionLabel = 'Agregar opción manual',
  onValueChange,
  onCreateOption,
}: CatalogSelectWithCustomProps) {
  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextValue = event.target.value;
    if (nextValue === CUSTOM_OPTION_VALUE) {
      onCreateOption();
      return;
    }
    onValueChange(nextValue);
  }

  return (
    <div className="space-y-2">
      <select className="input h-14 text-base" value={value} onChange={handleSelectChange}>
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        <option value={CUSTOM_OPTION_VALUE}>{createOptionLabel}</option>
      </select>
    </div>
  );
}
