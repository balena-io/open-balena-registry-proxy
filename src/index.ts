import * as express from "express";
import * as morgan from "morgan";
import * as proxy from "http-proxy-middleware";
import * as sdk from "./balena";

const PORT = parseInt(process.env.PORT || "5000", 10);
const INTERFACE = process.env.INTERFACE || "0.0.0.0";
const REGISTRY_HOST = process.env.REGISTRY_HOST || "registry2.balena-cloud.com";
const AUTH_HOST = process.env.AUTH_HOST || "api.balena-cloud.com";
const HTTPS = process.env.HTTPS || true;

const registryProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${HTTPS ? "https" : "http"}://${REGISTRY_HOST}`,
	changeOrigin: true,
	pathRewrite: async function (path, req) {
		const url = new URL(
			`${HTTPS ? "https" : "http"}://${REGISTRY_HOST}${path}`
		);

		console.debug("Processing /v2 URL...");
		console.debug(url);

		const repository =
			url.pathname.split("/").length === 7
				? url.pathname.split("/").slice(2, 5).join("/")
				: url.pathname.split("/").slice(2, 4).join("/");
		const tag = url.pathname.split("/").slice(-1).join("/");

		if (!repository || !tag) {
			console.error(`Unhandled path format: ${url.pathname}`);
			console.debug(url.pathname.split("/"));
			return path;
		}

		const imageLocation = await sdk.getImageLocation(repository, tag);

		if (!imageLocation) {
			console.error(`Failed to lookup fleet release: ${repository}:${tag}`);
			return path;
		}

		url.pathname = url.pathname.replace(repository, imageLocation.split('/').slice(1).join('/'));

		const newPath = url.href.replace(url.origin, '');

		console.debug(`Rewriting path: ${path} -> ${newPath}`);

		return newPath;
	},
	onProxyRes: async function (proxyRes, req, res) {
		// replace www-authenticate bearer realm to direct auth requests to the proxy
		if (proxyRes.headers["www-authenticate"]) {
			proxyRes.headers["www-authenticate"] = proxyRes.headers[
				"www-authenticate"
			].replace(
				`${HTTPS ? "https" : "http"}://${AUTH_HOST}`,
				`http://${req.headers.host}`
			);
			console.debug(proxyRes.headers);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: 'debug',
	target: `${HTTPS ? "https" : "http"}://${AUTH_HOST}`,
	changeOrigin: true,
	pathRewrite: async function (path, req) {
		const url = new URL(`${HTTPS ? "https" : "http"}://${AUTH_HOST}${path}`);
		console.debug("Processing /auth URL...");
		console.debug(url);

		const scope = url.searchParams.get("scope") || undefined;

		if (!scope) {
			console.error(`Unhandled params: ${url.searchParams.toString}`);
			return path;
		}

		const repository = scope.split(":")[1];

		// TODO: how does this work if authenticating for a release semver?
		const tag = "latest";

		const imageLocation = await sdk.getImageLocation(repository, tag);

		if (!imageLocation) {
			console.error(`Failed to find fleet release: ${repository}:${tag}`);
			return path;
		}

		url.searchParams.set(
			"scope",
			[scope.split(":")[0], imageLocation.split('/').slice(1).join('/'), scope.split(":")[2]].join(":")
		);

		const newPath = url.href.replace(url.origin, '');

		console.debug(`Rewriting path: ${path} -> ${newPath}`);

		return newPath;
	},
});

// create express server
const app = express();

// add logging
app.use(morgan("dev"));

// info endpoint
app.get("/info", (req, res, next) => {
	res.send("Pull images from balenaCloud container registry with fleet slugs!");
});

// proxied endpoints
app.use("/v2", registryProxy);

app.use("/auth", authProxy);

// start server
app.listen(PORT, INTERFACE, () => {
	console.log(`Starting Proxy at ${INTERFACE}:${PORT}`);
});
