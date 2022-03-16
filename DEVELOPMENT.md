# Development

This project can be deployed locally or on a balenaOS device for testing.

## Local Tests

```bash
# emulate a docker client with supertest
npm run test

# emulate a docker client with dockerode (requires docker)
npm run test:docker

# run a standalone docker daemon with docker compose (requires docker-compose)
npm run test:compose
```

## Deploy with Balena

You can one-click-deploy this project to balena using the button below:

[![deploy with balena](https://balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io/open-balena-registry-proxy)

### Manual Deployment

Alternatively, deployment can be carried out by manually creating a [balenaCloud account](https://dashboard.balena-cloud.com) and application,
flashing a device, downloading the project and pushing it via the [balena CLI](https://github.com/balena-io/balena-cli).

### Environment Variables

| Name             | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `REGISTRY2_HOST` | Upstream registry URL. The default is `registry2.balena-cloud.com`. |

### Public Device URL

Enable the [Public Device URL](https://www.balena.io/docs/learn/manage/actions/#enable-public-device-url)
in your device dashboard to expose an HTTPS endpoint for your local Docker daemon.

Using the public URL without the `https//` prefix you can now pull images directly from the balenaCloud container registry.

```bash
docker pull <UUID>.balena-devices.com/balenablocks/fin-block
```

### Insecure Registries

By default Docker won't communicate with an [insecure registry](https://docs.docker.com/engine/reference/commandline/dockerd/#insecure-registries)
so if you aren't using the Public Device URL or some other HTTPS endpoint you'll need to reconfigure your daemon.

Add an entry similar to this to your [docker daemon configuration file](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file).

```json
{ "insecure-registries": ["balena.local:80"] }
```

On Linux distros with systemd you can likely run `systemctl restart dockerd` to restart your daemon.
