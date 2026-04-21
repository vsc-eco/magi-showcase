export function Footer() {
	return (
		<footer id="footer" className="footer">
			<div className="footer-links">
				<a
					className="footer-button"
					href="https://github.com/vsc-eco/altera-app"
					target="_blank"
					rel="noopener noreferrer"
				>
					altera-app source
				</a>
				<a
					className="footer-button"
					href="https://github.com/vsc-eco/altera-app/blob/feature/magi-sdk/README.md"
					target="_blank"
					rel="noopener noreferrer"
				>
					SDK README
				</a>
				<a className="footer-button" href="#integrate">Integrate</a>
			</div>
			<div className="footer-attribution">
				<a href="https://altera.okinoko.io" target="_blank" rel="noopener noreferrer">
					<img
						src="/altera.png"
						alt="Altera"
						className="footer-attribution__logo"
					/>
				</a>
				<span>Theme borrowed from <a href="https://altera.okinoko.io" target="_blank" rel="noopener noreferrer">Altera</a>.</span>
			</div>
			<p className="footer-note">Built on Magi (VSC).</p>
		</footer>
	);
}
