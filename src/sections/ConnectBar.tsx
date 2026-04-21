interface ConnectBarProps {
	username: string | undefined;
	onConnect: () => void;
	onDisconnect: () => void;
}

export function ConnectBar({ username, onConnect, onDisconnect }: ConnectBarProps) {
	return (
		<div className="connect-bar">
			<span className="connect-bar__label">Wallet:</span>
			{username ? (
				<>
					<code className="connect-bar__user">@{username}</code>
					<button onClick={onDisconnect}>Disconnect</button>
				</>
			) : (
				<button onClick={onConnect}>Connect Hive wallet</button>
			)}
			<span className="connect-bar__network">Network: mainnet</span>
		</div>
	);
}
