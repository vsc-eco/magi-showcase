import { KeyTypes, type Aioha } from '@aioha/aioha';
import { MagiQuickSwap } from '@magi/widget';

interface Props {
	aioha: Aioha;
	username: string;
}

export function ReactBasic({ aioha, username }: Props) {
	return (
		<MagiQuickSwap
			aioha={aioha}
			username={username}
			keyType={KeyTypes.Active}
			defaultAssetIn="HBD"
			defaultAssetOut="BTC"
			onSuccess={(txId) => console.log('Swap broadcast:', txId)}
			onError={(err) => console.error('Swap failed:', err)}
		/>
	);
}
