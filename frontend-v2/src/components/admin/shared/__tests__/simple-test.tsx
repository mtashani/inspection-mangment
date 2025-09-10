import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
function TestComponent() {
  return <div>Test Component</div>;
}

describe('Simple Test', () => {
  it('should render test component', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});