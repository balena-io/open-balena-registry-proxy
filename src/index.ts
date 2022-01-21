import * as express from "express";
import * as morgan from "morgan";
import * as proxy from "http-proxy-middleware";
import * as sdk from "./sdk";

// Configuration
const PORT = parseInt(process.env.PORT || "5000", 10);
const INTERFACE = process.env.INTERFACE || "0.0.0.0";
const REGISTRY_URL =
	process.env.REGISTRY_URL || "https://registry2.balena-cloud.com";

const rewriteFn = async (path: string, req: any) => {
	let imageReference = req.path.split("/");
	// console.debug(imageReference);

	if (imageReference.length !== 7) {
		console.error(
			"Expected image reference format is /v2/{org}/{fleet}/{service}/manifests/{version}"
		);
		return undefined;
	}

	let fleet = imageReference.slice(2, 4).join("/");
	let service = imageReference[4] || "main";
	let version = imageReference[6] || "latest";

	if (!version || version === "latest") {
		// TODO: lookup default fleet release via SDK
	}

	console.debug(`fleet: ${fleet}`);
	console.debug(`service: ${service}`);
	console.debug(`version: ${version}`);

	const imageLocation = await sdk.getImageLocation(fleet, service, version);

	if (!imageLocation) {
		console.error(
			"Failed to map path to a fleet release, is the fleet public?"
		);
		return undefined;
	}

	// TODO: use the registry host instead of discarding it
	const locationPath =
		"/" + imageLocation.split("/").slice(1).join("/") + "/manifests/latest";

	return locationPath;
};

const proxyOptions = {
	target: REGISTRY_URL,
	changeOrigin: true,
	pathRewrite: async function (path: string, req: any) {
		const newPath = await rewriteFn(path, req);
		console.debug(`Path rewrite: ${path} -> ${newPath}`);
		if (!newPath) {
			return "";
		}
		return newPath;
	},
};

const registryProxy = proxy.createProxyMiddleware(proxyOptions);

// create express server
const app = express();

// add logging
app.use(morgan("dev"));

// info endpoint
app.get("/info", (req, res, next) => {
	res.send("Proxied names for balenaCloud registry fleet images.");
});

// proxied endpoints
app.use("/v2/*/*/*/*", registryProxy);

// start server
app.listen(PORT, INTERFACE, () => {
	console.log(`Starting Proxy at ${INTERFACE}:${PORT}`);
});
