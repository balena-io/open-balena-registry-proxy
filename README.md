# open-balena-registry-proxy

Pull release images from the balenaCloud container registry with application slugs!

## Getting Started

You can one-click-deploy this project to balena using the button below:

[![deploy with balena](https://balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-playground/balena-registry-proxy)

## Manual Deployment

Alternatively, deployment can be carried out by manually creating a [balenaCloud account](https://dashboard.balena-cloud.com) and application,
flashing a device, downloading the project and pushing it via the [balena CLI](https://github.com/balena-io/balena-cli).

### Environment Variables

| Name            | Description                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `REGISTRY_URL`  | Upstream registry URL. The default is `https://registry2.balena-cloud.com`.                                                                      |
| `API_URL`       | Upstream API URL used for authentication and release mapping. The default is `https://api.balena-cloud.com`.                                     |
| `API_TOKEN`     | (optional) Session token or API key to authenticate with the balenaCloud API (<https://www.balena.io/docs/learn/manage/account/#access-tokens>). |
| `API_USER`      | (optional) The balenaCloud username prefixed with `u_` associated with the token above. Only used for testing.                                   |
| `CACHE_MAX_AGE` | The maximum age of the cached API lookups. The default is `600` seconds.                                                                         |

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
{
"insecure-registries": ["mydevice.local:80"]
}
```

```bash
docker pull mydevice.local:80/balenablocks/dashboard
```

### Private Releases

Authenticating to private releases only works if the proxy server has an API token with the same access rights as the logged in user.

```bash
# get an API token from your balenaCloud dashboard
API_TOKEN=********

# set the API_TOKEN env var on your device where the proxy is running
balena env add API_TOKEN --device 7cf02a6 "$API_TOKEN"

# login to the registry via the proxy with your username prefixed by "_u"
echo "$API_TOKEN" | docker login --username "u_myusername" --password-stdin mydevice.balena-devices.com

# pull from private apps
docker pull mydevice.balena-devices.com/myorg/myapp
```

## How does it work?

1. The docker/balena client performs an [API version check](https://docs.docker.com/registry/spec/api/#api-version-check) on the registry (via the proxy)
2. The registry responds that we are indeed `v2` and provides a `www-authentication` header with instructions on how to authenticate via balena API
3. The proxy intercepts the `www-authentication` header in the response and replaces the URL to the balena API with it's own (very sneaky proxy)
4. The client requests an auth token from the API (actually the proxy now) for access to `/org/application/release` in the registry
5. The proxy intercepts this auth request and asks the API where to find the image for `/org/application/release`
6. The proxy forwards the auth request after substituting `/org/application/release` with `/v2/b1678e01687d42ae9b2fe254543c7d18` in the URL
7. The API happily provides an auth token following the [Docker Registry v2 Authentication Specification](https://docs.docker.com/registry/spec/auth/token/)
8. The client uses this new token to request a pull of image `/org/application/release` from the registry
9. Again, the proxy intercepts this pull request and asks the API where to find the image for `/org/application/release` (hopefully this was cached)
10. The proxy forwards the pull request after substituting `/org/application/release` with `/v2/b1678e01687d42ae9b2fe254543c7d18` in the URL

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.
