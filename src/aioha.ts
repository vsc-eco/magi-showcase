import { Aioha } from '@aioha/aioha';

// Keychain only — keeps the showcase's Aioha path trivially testable and
// avoids provider-specific setup (OAuth callbacks for HiveSigner, QR /
// deep-link flows for HiveAuth). Integrators who need those can follow
// the normal Aioha provider-registration pattern; the showcase just
// needs one working flow to demo the widget.
export function createShowcaseAioha(): Aioha {
	const instance = new Aioha();
	instance.registerKeychain();
	return instance;
}
