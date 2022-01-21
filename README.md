# balena-registry-proxy

Proxied names for balenaCloud registry fleet images.

## Description

Since images in balenaCloud registry are stored as a unique hash, this proxy will
allow pulling those same images with a human-readable format.

This is especially useful for blocks, that are otherwise unable to be pulled
from the balenaCloud registry.

## Usage

Note that only public (open) fleet images can be pulled with this proxy.

```bash
docker pull localhost:5000/balenalabs/balenasound/audio:latest
```

The expected image reference format is `{proxy_host}/{fleet_slug}/{service}/{version}`.

- `proxy_host` is the host:port where the proxy is running, such as `localhost:80`
- `fleet_slug` is a balenaCloud fleet slug in the format `org/fleet`
- `service` the fleet service image to pull, or `main` if only one service
- `version` the fleet release version string, such as `3.8.2+rev1`
