import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

describe('static AA billing page hardening', () => {
	it('declares a restrictive Content Security Policy', () => {
		expect(html).toContain('Content-Security-Policy');
		expect(html).toContain("object-src 'none'");
		expect(html).toContain("frame-ancestors 'none'");
		expect(html).toContain("connect-src 'none'");
	});

	it('sanitizes persisted data before hydrating state', () => {
		expect(html).toContain('const sanitizeLoadedData = (data) =>');
		expect(html).toContain('return sanitizeLoadedData(JSON.parse(saved));');
		expect(html).toContain('const sanitizeShares = (value) =>');
	});

	it('uses React 18 createRoot instead of the legacy renderer', () => {
		expect(html).toContain('ReactDOM.createRoot');
		expect(html).not.toContain('ReactDOM.render(<AABillCalculator />');
	});
});
