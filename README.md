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

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.

## TODO

- support for private fleets and docker login
