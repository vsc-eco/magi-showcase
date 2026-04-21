import { render, screen } from '@testing-library/react';
import { Features } from '../../src/sections/Features';

describe('Features', () => {
	it('renders three feature cards', () => {
		render(<Features />);
		expect(screen.getByText(/6 swap paths/i)).toBeInTheDocument();
		expect(screen.getByText(/4 integration modes/i)).toBeInTheDocument();
		expect(screen.getByText(/zero config/i)).toBeInTheDocument();
	});
});
