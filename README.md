# open-balena-registry-proxy

Pull release images from the balenaCloud container registry with application slugs!

## Getting Started

You can one-click-deploy this project to balena using the button below:

[![deploy with balena](https://balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io/open-balena-registry-proxy)

## Manual Deployment

Alternatively, deployment can be carried out by manually creating a [balenaCloud account](https://dashboard.balena-cloud.com) and application,
flashing a device, downloading the project and pushing it via the [balena CLI](https://github.com/balena-io/balena-cli).

### Environment Variables

| Name             | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `REGISTRY2_HOST` | Upstream registry URL. The default is `registry2.balena-cloud.com`. |

## Usage

### Image Reference

The expected image reference format is `<org>/<app>/<commit|semver>:[tag]?` where:

- `<org>/<app>` is a balenaCloud application slug
- `<commit|semver>` (optional) the application release, either the commit or the semver
- `[tag]` is optional and is ignored

The `<commit|semver>` can take multiple formats, but `+` symbols are not supported in docker paths so some rules are followed:

- a final release version like `1.2.3` will pull the latest final release of that version (eg. `1.2.3+rev4`)
- a draft release version like `1.2.3-1234567890`
- any successful release commit like `b1678e01687d42ae9b2fe254543c7d18`
- unset, `latest`, `current`, `default`, `pinned` are all aliases for the current pinned release

### Public Device URL

Enable the [Public Device URL](https://www.balena.io/docs/learn/manage/actions/#enable-public-device-url)
in your device dashboard to expose an HTTPS endpoint for your local Docker daemon.

Using the public URL without a prefix you can now pull images directly from the balenaCloud container registry.

```bash
docker pull mydevice.balena-devices.com/balenablocks/dashboard
```

```dockerfile
FROM mydevice.balena-devices.com/balenablocks/dashboard
```

```yaml
service:
    myService:
        image: mydevice.balena-devices.com/balenablocks/dashboard
```

### Insecure Registries

By default Docker won't communicate with an [insecure registry](https://docs.docker.com/engine/reference/commandline/dockerd/#insecure-registries)
so if you aren't using the Public Device URL or some other HTTPS endpoint you'll need to reconfigure your daemon.

Add an entry similar to this to your [docker daemon configuration file](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file).

```json
{ "insecure-registries": ["mydevice.local:80"] }
```

On Linux distros with systemd you can likely run `systemctl restart dockerd` to restart your daemon.

### Authentication

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
# emulate a docker client with supertest
npm run test

# emulate a docker client with dockerode (requires docker)
npm run test:docker

# run a standalone docker daemon with docker compose (requires docker-compose)
npm run test:compose
```

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.
