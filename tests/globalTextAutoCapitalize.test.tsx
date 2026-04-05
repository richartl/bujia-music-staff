import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { GlobalTextAutoCapitalize } from '../src/components/behavior/GlobalTextAutoCapitalize';

function TextFormHarness() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <>
      <GlobalTextAutoCapitalize />
      <label htmlFor="name">Nombre</label>
      <input id="name" value={name} onChange={(event) => setName(event.target.value)} />

      <label htmlFor="email">Email</label>
      <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
    </>
  );
}

describe('GlobalTextAutoCapitalize', () => {
  it('capitaliza inputs de texto al salir del campo', () => {
    render(<TextFormHarness />);
    const input = screen.getByLabelText('Nombre');

    fireEvent.change(input, { target: { value: 'juAn péRez' } });
    fireEvent.blur(input);

    expect((input as HTMLInputElement).value).toBe('Juan Pérez');
  });

  it('no transforma campos excluidos (email)', () => {
    render(<TextFormHarness />);
    const email = screen.getByLabelText('Email');

    fireEvent.change(email, { target: { value: 'UPPER@MAIL.COM' } });
    fireEvent.blur(email);

    expect((email as HTMLInputElement).value).toBe('UPPER@MAIL.COM');
  });
});
