# open-balena-registry-proxy

Pull release images from the balenaCloud container registry with block|fleet slugs!

## Getting Started

Publish your block or fleet to balenaHub following the steps here: <https://hub.balena.io/submit>

Once your block|fleet is published, you can update your documentation to use one of the following URLs for pulling images:

- `bh.cr/myorg/myblock`
- `bhcr.io/myorg/myblock`

## Usage

The expected image reference format is `bh.cr/<org>/<app>/<commit|version>:[tag]` where:

- `<org>/<app>` is the application slug as shown in the Summary pane of the balenaCloud dashboard
- `<commit|version>` is the optional application release, either the commit or the version
- `[tag]` is not required and is ignored

_Why aren't we using the tag to specify the version?_

When a Docker client requests access to a balenaCloud image repository, our registry instructs the client to contact our API for a token following the [Token Authentication Specification](https://docs.docker.com/registry/spec/auth/token/). Our API will then provide a JWT with push|pull permissions
based on the login provided and the repository in question.

In balenaCloud we store every release image in a unique repository in the format `/v2/randomhash`. This allows us to rename organizations and applications without breaking the links to the release images. When your balena device downloads a release image this all happens transparently via the Supervisor and API target state.

However, Docker clients do not provide the tag when requesting a token from an authorization endpoint like our API. Instead they only request access to a repository like `docker.io/library/alpine` and do not provide a tag until it's time to start pulling layers.

Without the full path to the repository in the `/v2/randomhash` format we wouldn't know which image was being requested and would have to assume latest in all cases. So in order to provide a JWT with permissions to the desired repo we need to know the release version or commit during the earliest authorization steps when the tag is not available!

### Examples

Pull the default release as set in the Summary pane of the balenaCloud dashboard.

```yaml
service:
    fin-block:
        image: bh.cr/balenablocks/fin-block
```

Aliases like `latest`, `current`, `default`, `pinned` will also pull the default release.

```yaml
service:
    fin-block:
        image: bh.cr/balenablocks/fin-block/latest
```

Pull a specific final release version as shown in the Releases pane of the balenaCloud dashboard.
Note that specifying a revision via `+rev_` is not supported and the highest revision will be pulled.

```yaml
service:
    fin-block:
        image: bh.cr/balenablocks/fin-block/3.6.0
```

Pull a specific draft release version as shown in the Releases pane of the balenaCloud dashboard.

```yaml
service:
    fin-block:
        image: bh.cr/balenablocks/fin-block/3.6.0-1640898570135
```

Pull a specific release commit as shown in the Releases pane of the balenaCloud dashboard.

```yaml
service:
    fin-block:
        image: bh.cr/balenablocks/fin-block/490a6b48a457bcb49d558fc1b82cfed5
```

### Authentication

This proxy is most effective with public blocks and fleets,
but it's also possible to pull images from private blocks|fleets using your balenaCloud credentials and `docker login`.

```bash
docker login bh.cr
Username: u_bob        # balenaCloud username prefixed by "_u"
Password: ************ # balenaCloud API token

docker pull bh.cr/myprivateorg/myprivateapp
```

### Development

For testing and local development of this proxy see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.
