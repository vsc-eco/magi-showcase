/// <reference types="vite/client" />

declare module '*?highlight' {
	export const source: string;
	export const html: string;
	const highlighted: { source: string; html: string };
	export default highlighted;
}
