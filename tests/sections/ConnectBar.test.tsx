import { render, screen } from '@testing-library/react';
import { ConnectBar } from '../../src/sections/ConnectBar';

describe('ConnectBar', () => {
	it('shows a Connect button when disconnected', () => {
		render(<ConnectBar username={undefined} onConnect={() => {}} onDisconnect={() => {}} />);
		expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
	});
	it('shows @username and a Disconnect button when connected', () => {
		render(<ConnectBar username="lordbutterfly" onConnect={() => {}} onDisconnect={() => {}} />);
		expect(screen.getByText(/@lordbutterfly/)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
	});
});
