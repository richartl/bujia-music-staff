import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { GlobalTextAutoCapitalize } from '../src/components/behavior/GlobalTextAutoCapitalize';

function TextFormHarness() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <>
      <GlobalTextAutoCapitalize />
      <label htmlFor="name">Nombre</label>
      <input id="name" value={name} onChange={(event) => setName(event.target.value)} />

      <label htmlFor="email">Email</label>
      <input id="email" type="email" data-text-normalization="off" value={email} onChange={(event) => setEmail(event.target.value)} />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" data-text-normalization="off" value={password} onChange={(event) => setPassword(event.target.value)} />
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

  it('no transforma email cuando el campo marca preserve-case', () => {
    render(<TextFormHarness />);
    const email = screen.getByLabelText('Email');

    fireEvent.change(email, { target: { value: 'UPPER@MAIL.COM' } });
    fireEvent.blur(email);

    expect((email as HTMLInputElement).value).toBe('UPPER@MAIL.COM');
  });

  it('no transforma password cuando el campo marca preserve-case', () => {
    render(<TextFormHarness />);
    const password = screen.getByLabelText('Password');

    fireEvent.change(password, { target: { value: 'AbC123xYz' } });
    fireEvent.blur(password);

    expect((password as HTMLInputElement).value).toBe('AbC123xYz');
  });
});
