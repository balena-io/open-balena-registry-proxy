target "default" {
  dockerfile = "Dockerfile"
  platforms = [
    "linux/amd64",
    "linux/arm64"
  ]
  cache-from = [
    "docker.io/balena/open-balena-registry-proxy:latest",
    "docker.io/balena/open-balena-registry-proxy:master",
  ]
}
