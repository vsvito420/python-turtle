interface Env {
	ASSETS: {
		fetch: (request: Request) => Promise<Response>;
	};
}

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		// API-Route
		if (url.pathname.startsWith('/api/')) {
			return Response.json({
				status: 'online',
				version: '1.0.0',
				timestamp: new Date().toISOString()
			});
		}

		// Für alle anderen Anfragen nutzen wir ASSETS (von Cloudflare bereitgestellt)
		// und verlassen uns auf die "not_found_handling": "single-page-application"
		// Konfiguration in wrangler.jsonc, die automatisch zur index.html weiterleitet
		try {
			// Versuche, die Anfrage durch Cloudflare ASSETS zu bearbeiten
			return await env.ASSETS.fetch(request);
		} catch (e) {
			// Fallback: Wenn aus irgendeinem Grund ASSETS nicht funktioniert,
			// leiten wir manuell zur index.html weiter
			console.error("Error serving asset:", e);

			// Erstelle eine neue Anfrage für index.html
			const indexRequest = new Request(new URL('/', url).toString(), request);
			return env.ASSETS.fetch(indexRequest);
		}
	}
} satisfies ExportedHandler<Env>;
