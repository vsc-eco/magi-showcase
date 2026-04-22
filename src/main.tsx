import React from 'react';
import { createRoot } from 'react-dom/client';
import '@vsc.eco/crosschain-widget/styles.css';
import '@vsc.eco/crosschain-widget/themes/altera-dark.css';
import './styles.css';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
