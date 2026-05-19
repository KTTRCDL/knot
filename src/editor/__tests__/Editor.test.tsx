import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Editor } from '../Editor';

describe('Editor', () => {
  it('renders an editable surface', () => {
    render(<Editor initialContent="# Hello" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
