# open-balena-registry-proxy

Pull release images from the balenaCloud container registry with block|fleet slugs!

## Getting Started

Publish your block or fleet to balenaHub following the steps here: <https://hub.balena.io/submit>

Once your block|fleet is published, you can update your documentation to use one of the following URLs for pulling images:

- `bh.cr/myorg/myblock`
- `bhcr.io/myorg/myblock`

## Usage

The expected image reference format is `bh.cr/<org>/<app>/<commit|version>:[tag]` where:

- `<org>/<app>` is the application Slug as shown in the Summary pane of the balenaCloud dashboard
- `<commit|version>` is the optional application release, either the commit or the version
- `[tag]` is not required and is ignored

_Why aren't we using the tag to specify the version?_

When a Docker client requests access to a balenaCloud image repository, our registry instructs the client to contact our API for a token following the [Token Authentication Specification](https://docs.docker.com/registry/spec/auth/token/). Our API will then provide a JWT with push|pull permissions
based on the login provided and the repository in question.

In balenaCloud we store every release image in a unique repository in the format `/v2/randomhash`. This allows us to rename organizations and applications without breaking the links to the release images. When your balena device downloads a release image this all happens transparently via the Supervisor and API target state.

However, Docker clients do not provide the tag when requesting a token from an authorization endpoint like our API. Instead they only request access to a repository like `docker.io/library/alpine` and do not provide a tag until it's time to start pulling layers.

Without the full path to the repository in the `/v2/randomhash` format we wouldn't know which image was being requested and would have to assume latest in all cases. So in order to provide a JWT with permissions to the desired repo we need to know the release version or commit during the earliest authorization steps when the tag is not available!

### Examples

Here's how to pull a specific release version given several available releases in the dashboard.

```yaml
services:
  # Browser block service added to the multicontainer fleet
  browser:
    image: bh.cr/balenablocks/browser-aarch64/2.3.8
    privileged: true
    network_mode: host
```

Note that specifying a revision via `+rev_` is not supported in image URLs as the plus sign is considered a special character. Instead, we will default to pulling the latest revision when a release version is provided.

So if there are multiple revisions of a release, for example `2.3.8`, `2.3.8+rev1`, and `2.3.8+rev2`, specifying `2.3.8` in the image reference will result in `2.3.8+rev2` being pulled.

During development you may want to pull a draft release for testing. Since draft releases are not included in the latest release track, you must specify the whole version string including the build stamp.

```yaml
services:
  # Browser block service added to the multicontainer fleet
  browser:
    image: bh.cr/balenablocks/browser-aarch64/2.4.1-1648554962021
    privileged: true
    network_mode: host
```

You can also refer to a release by its build commit by copying the commit hash from the first column of the releases dashboard.

```yaml
services:
  # Browser block service added to the multi-container fleet
  browser:
    image: bh.cr/balenablocks/browser-aarch64/11e1ee23d7ddf6ab6da99bac26c9d274
    privileged: true
    network_mode: host
```

### Private Registries

In some cases, you may want to deploy blocks from a private organization.
In order to do this, you need to enable balena to authenticate with the registry during the build,
which is done by passing the `--registry-secrets` option with a path to the authentication secrets. An example is shown below:

For `balena push`:

```bash
balena push myFleet --registry-secrets ../secrets.yml
```

Or for `balena deploy`:

```bash
balena deploy myFleet --registry-secrets ../secrets.yml
```

You can also save a file with secrets in JSON or YAML format in your home directory
under `~/.balena/secrets.<yml|json>`, which will automatically be used for the secrets
if it exists and the `--registry-secrets` switch has not been passed to `balena push`.

JSON example:

```json
{
  "bh.cr": {
    "username": "u",
    "password": "API_KEY"
  }
}
```

YAML example:

```yaml
'bh.cr':
    username: u
    password: API_KEY
```

Note that the username can be any non-zero length string, as long as the API key is associated with a user that has access to the org.

You can also login via your typical Docker client with `docker login`:

```bash
docker login bh.cr
Username: u            # balenaCloud username
Password: ************ # balenaCloud API token

docker pull bh.cr/myorg/myapp  
```

Sources:

- <https://www.balena.io/docs/learn/deploy/deployment/#private-base-images>
- <https://www.balena.io/docs/learn/more/masterclasses/cli-masterclass/#7-using-private-registries>

### Development

For testing and local development of this proxy see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Contributing

Please open an issue or submit a pull request with any features, fixes, or changes.
