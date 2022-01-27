# balena-registry-proxy

Pull images from balenaCloud container registry with fleet slugs!

## Getting Started

You can one-click-deploy this project to balena using the button below:

[![deploy with balena](https://balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/balena-registry-proxy)

## Manual Deployment

Alternatively, deployment can be carried out by manually creating a [balenaCloud account](https://dashboard.balena-cloud.com) and application,
flashing a device, downloading the project and pushing it via the [balena CLI](https://github.com/balena-io/balena-cli).

## Usage

### Image Reference

The expected image reference format is `<proxy>/<fleet//slug>/<release>/<service>[:tag]`.

- `proxy` is the host:port where the proxy is running, such as `localhost:80` or `foobar.balena-devices.com`
- `fleet//slug` is a balenaCloud fleet slug in the format `org/fleet`
- `release` (optional) the fleet release, either the commit or the version
- `service` (optional) if the fleet contains multiple services you can specify one here
- `tag` is optional and is ignored

The `release` can take multiple formats, but `+` symbols are not supported in docker paths so some assumptions are made for final releases.

- a final release version like `1.2.3` will pull the latest final release of that version (eg. `1.2.3+rev4`)
- a draft release version like `1.2.3-1234567890`
- any successful release commit like `b1678e01687d42ae9b2fe254543c7d18`
- unset, `latest`, `current`, `default`, `pinned` are all aliases for the current pinned release

### Public Device URL

Enable the public device URL in the dashboard remove the `https://` prefix for your proxy host.

```bash
docker pull foobar.balena-devices.com/balenablocks/dashboard
```

```dockerfile
FROM foobar.balena-devices.com/balenablocks/dashboard
```

### Local Device IP

Alternatively, you can use the proxy via your device IP but you'll need to enable [insecure registries](https://docs.docker.com/engine/reference/commandline/dockerd/#insecure-registries).

Add an entry similar to this to your [docker daemon configuration file](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file)

```json
{
    "insecure-registries" : [ "foobar.local:80" ]
}
```

```bash
docker pull foobar.local:80/balenablocks/dashboard
```

```dockerfile
FROM foobar.local:80/balenablocks/dashboard
```

### Localhost

You can also run this on your workstation with docker compose, and localhost is allowed as insecure by default.

```bash
docker-compose up --build
```

```bash
docker pull localhost:80/balenablocks/dashboard
```

```dockerfile
FROM localhost:80/balenablocks/dashboard
```

## Testing

Run a containerized docker daemon, docker client, and the registry proxy.

```bash
docker-compose -f docker-compose.test.yml up --build
```

## How does it work?

1. The docker/balena client performs an [API version check](https://docs.docker.com/registry/spec/api/#api-version-check) on the registry (via the proxy)
2. The registry responds that we are indeed `v2` and provides a `www-authentication` header with instructions on how to authenticate via balena API
3. The proxy intercepts the `www-authentication` header in the response and replaces the URL to the balena API with it's own (very sneaky proxy)
4. The client requests an auth token from the API (actually the proxy now) for access to `/org/fleet/release` in the registry
5. The proxy intercepts this auth request and asks the API where to find the image for `/org/fleet/release`
6. The proxy forwards the auth request after substituting `/org/fleet/release` with `/v2/b1678e01687d42ae9b2fe254543c7d18` in the URL
7. The API happily provides an auth token following the [Docker Registry v2 Authentication Specification](https://docs.docker.com/registry/spec/auth/token/)
8. The client uses this new token to request a pull of image `/org/fleet/release` from the registry
9. Again, the proxy intercepts this pull request and asks the API where to find the image for `/org/fleet/release` (hopefully this was cached)
10. The proxy forwards the pull request after substituting `/org/fleet/release` with `/v2/b1678e01687d42ae9b2fe254543c7d18` in the URL

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.

## TODO

- experiment with support for private fleets and docker login
