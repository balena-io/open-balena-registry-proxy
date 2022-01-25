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
	logLevel: "debug",
	target: `${HTTPS ? "https" : "http"}://${REGISTRY_HOST}`,
	changeOrigin: true,
	pathRewrite: async function (path, req) {
		const url = new URL(
			`${HTTPS ? "https" : "http"}://${REGISTRY_HOST}${path}`
		);

		// pathname should be in the format
		// /v2/org/fleet/service/release/method/tag
		const imageRef = url.pathname.split("/");
		imageRef.shift(); // drop the preceding empty element

		const version = imageRef.shift(); // should always be v2 for balenaCloud
		const tag = imageRef.pop(); // we can't use the tag as each release has a unique repo
		const method = imageRef.pop(); // 'manifests' or 'blobs'
		const repository = imageRef.join("/"); // whatever is left should be the 2-4 depth repository path

		if (!repository || !tag) {
			// console.error(`Unhandled path format: ${url.pathname}`);
			// console.debug(url.pathname.split("/"));
			return path;
		}

		const imageLocation = await sdk.getImageLocation(repository);

		if (!imageLocation) {
			console.error(`Failed to lookup fleet release: ${repository}`);
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split("/").slice(1).join("/");

		// update the path with the repository path retrieved from the api
		url.pathname = url.pathname.replace(repository, imagePath);

		// if we are getting the manifest list the tag should always be "latest"
		if (method === "manifests") {
			url.pathname = url.pathname.replace(tag, "latest");
		}

		// remove the host prefix from the url parser href so we are left with the path and params
		const newPath = url.href.replace(url.origin, "");

		// console.debug(`Rewriting path: ${path} -> ${newPath}`);

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
			// console.debug(proxyRes.headers);
		}
	},
});

const authProxy = proxy.createProxyMiddleware({
	logLevel: "debug",
	target: `${HTTPS ? "https" : "http"}://${AUTH_HOST}`,
	changeOrigin: true,
	pathRewrite: async function (path, req) {
		const url = new URL(`${HTTPS ? "https" : "http"}://${AUTH_HOST}${path}`);

		// console.debug("Processing /auth URL...");
		// console.debug(url);

		// parse the scope parameter from the auth request
		// https://docs.docker.com/registry/spec/auth/token/
		const scope = url.searchParams.get("scope") || undefined;

		if (!scope) {
			console.error(`Unhandled auth params: ${url.searchParams.toString}`);
			return path;
		}

		const scopeRef = scope.split(":");

		const resourceType = scopeRef.shift(); // eg. 'repository'
		const resourceName = scopeRef.shift(); // eg. 'org/fleet/service/release'
		const resourceAction = scopeRef.shift(); // eg. 'pull'

		if (!resourceName) {
			console.error(`Unhandled auth params: ${url.searchParams.toString}`);
			return path;
		}

		const imageLocation = await sdk.getImageLocation(resourceName);

		if (!imageLocation) {
			console.error(`Failed to lookup fleet release: ${resourceName}`);
			return path;
		}

		// remove the registry host prefix
		const imagePath = imageLocation.split("/").slice(1).join("/");

		// update the scope with the repository path retrieved from the api
		url.searchParams.set(
			"scope",
			[resourceType, imagePath, resourceAction].join(":")
		);

		// remove the host prefix from the url parser href so we are left with the path and params
		const newPath = url.href.replace(url.origin, "");

		// console.debug(`Rewriting path: ${path} -> ${newPath}`);

		return newPath;
	},
});

// create express server
const app = express();

// add logging
// app.use(morgan("dev"));

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
