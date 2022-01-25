# balena-registry-proxy

Pull images from balenaCloud container registry with fleet slugs!

## Description

Since images in balenaCloud registry are stored as a unique hash, this proxy will
allow pulling those same images with a human-readable format.

## Usage

```bash
docker pull localhost:5000/balenalabs/balenasound/audio:latest
```

The expected image reference format is `{proxy_host}/{fleet_slug}/{service}/{version}`.

- `proxy_host` is the host:port where the proxy is running, such as `localhost:80`
- `fleet_slug` is a balenaCloud fleet slug in the format `org/fleet`
- `service` the fleet service image to pull, `main` is assumed if not provided
- `version` the fleet release version string, such as `3.8.2+rev1` or `latest`
