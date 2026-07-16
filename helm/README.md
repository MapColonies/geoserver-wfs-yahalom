# Helm suite for complete Geoserver - WFS for sync-layers
[Home](../README.md)
* The helm provides ready-to-use [layers](https://github.com/MapColonies/sync-layer-server) serving by WFS protocol
* The initialization use side car to prepare the Geoserver to be ready to use all relevant data
* Based on [kartoza/helm for geoserver](https://github.com/kartoza/charts/tree/develop/charts/geoserver/v0.3.3)
* Use kartoza-based Geoserver images [geoserver-os from mapcolonies github](https://github.com/MapColonies/geoserver)

## Main Features

### Layer Auto-Config 
* On deploy, once geoserver rest api is up, the sidecar will run and configure the WFS layer definitions.
* Readiness will be valid when it detects the featureDescribe of the layers.

### B2B Support
* Deployment includes an infra-nginx sub-chart to handle authentication and routing

> [!IMPORTANT]
> PROXY_BASE_URL must be changed according to the deployed route.


## Deployment

1. Create charts:
```bash
helm dependency build .
```
2. Deploy:
```bash
helm install deployment-name .
```

> [!CAUTION]
> Validate the route section in values as false if you deploy with nginx.


## Dev-local mode
1. Configure route on. Value level to true
```yaml
route:
  enabled: true
  tls: false
  path: /geoserver
```
2. Configure PROXY_BASE_URL:
```yaml
extraGeoserverEnv: |
  - name: COMMUNITY_EXTENSIONS
    value: "cog-plugin"
  - name: JAVA_OPTS
    value: '-DALLOW_ENV_PARAMETRIZATION=true'
  - name: PROXY_BASE_URL
    value: /geoserver
```
3. Validate the nginx scope is disabled:
```yaml
nginx:
  enabled: false
```
