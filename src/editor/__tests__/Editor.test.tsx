import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { Editor } from '../Editor';

describe('Editor', () => {
  it('renders a wrapper textbox role for the editor surface', () => {
    render(<Editor initialContent="# Hello" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('mounts a Crepe (ProseMirror) instance inside the wrapper', async () => {
    const { container } = render(
      <React.StrictMode>
        <Editor initialContent="# Hello" onChange={() => {}} />
      </React.StrictMode>
    );
    // Crepe creates a ProseMirror editor as a descendant of the wrapper.
    // findBy* polls for up to 1s so the async Crepe.create() has time to land.
    const proseMirror = await screen.findByText(/Hello/);
    expect(proseMirror).toBeInTheDocument();
    expect(container.querySelector('.ProseMirror')).not.toBeNull();
  });
});
