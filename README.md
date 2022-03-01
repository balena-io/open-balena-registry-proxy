# open-balena-registry-proxy

Pull release images from the balenaCloud container registry with application slugs!

## Getting Started

You can one-click-deploy this project to balena using the button below:

[![deploy with balena](https://balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/balena-registry-proxy)

## Manual Deployment

Alternatively, deployment can be carried out by manually creating a [balenaCloud account](https://dashboard.balena-cloud.com) and application,
flashing a device, downloading the project and pushing it via the [balena CLI](https://github.com/balena-io/balena-cli).

### Environment Variables

| Name             | Description                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `REGISTRY2_HOST` | Upstream registry URL. The default is `registry2.balena-cloud.com`.                                                                              |
| `API_HOST`       | Upstream API URL used for authentication and release mapping. The default is `api.balena-cloud.com`.                                             |

## Usage

### Image Reference

The expected image reference format is `proxy:port/org/application/release?/service?[:tag]?`.

- `proxy:port` is the host:port where the proxy is running, such as `localhost:80` or `foobar.balena-devices.com`
- `org/application` is a balenaCloud application slug
- `release` (optional) the balenaCloud release, either the commit or the version
- `service` (optional) if the balenaCloud release contains multiple services you can specify one here
- `:tag` is optional and is ignored

The `release` can take multiple formats, but `+` symbols are not supported in docker paths so some assumptions are made for final releases.

- a final release version like `1.2.3` will pull the latest final release of that version (eg. `1.2.3+rev4`)
- a draft release version like `1.2.3-1234567890`
- any successful release commit like `b1678e01687d42ae9b2fe254543c7d18`
- unset, `latest`, `current`, `default`, `pinned` are all aliases for the current pinned release

### Public Device URL

Enable the public device URL in the dashboard remove the `https://` prefix for your proxy host.

```bash
docker pull mydevice.balena-devices.com/balenablocks/dashboard
```

```dockerfile
FROM mydevice.balena-devices.com/balenablocks/dashboard
```

### Local Device IP

Alternatively, you can use the proxy via your device IP but you'll need to enable [insecure registries](https://docs.docker.com/engine/reference/commandline/dockerd/#insecure-registries).

Add an entry similar to this to your [docker daemon configuration file](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file)

```json
{"insecure-registries": ["mydevice.local:80"]}
```

```bash
docker pull mydevice.local:80/balenablocks/dashboard
```

### Private Releases

Get a balena access token from the dashboard or the balena CLI and use it with `docker login`.

```bash
docker login mydevice.balena-devices.com                               
Username: u_bob        # your username prefixed by "_u"
Password: ************ # balena-cloud API token

# pull from private apps
docker pull mydevice.balena-devices.com/myorg/myapp
```

## Testing

```bash
npm run test
npm run test:compose
```

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.
