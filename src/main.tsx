import React from 'react';
import { createRoot } from 'react-dom/client';
import '@magi/widget/styles.css';
import '@magi/widget/themes/altera-dark.css';
import './styles.css';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
