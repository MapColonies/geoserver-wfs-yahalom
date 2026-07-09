# Changelog

## 1.0.0 (2026-07-09)


### ⚠ BREAKING CHANGES

* Update side car and helm (MAPCO-4963) ([#9](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/9))

### Features

* first WFS support for sync-layers ([#1](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/1)) ([892079b](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/892079baeb90e08f0607b74df4986040acad75c7))
* geoserver persistent dataDir (MAPCO-4961, MAPCO-4983) ([#7](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/7)) ([63421ca](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/63421ca18695384e4b448237c54cfdf775ac1402))
* **helm:** update nginx  and dependencies for geoserver(MAPCO-10123) ([#36](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/36)) ([99f0fc0](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/99f0fc0bdbced3a0d6539825694bb512e40e6295))
* **helm:** update nginx version to 2.1.6 in Chart.yaml  ([#42](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/42)) ([7d0a488](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/7d0a488ca715491551d3e11cd2faee3374343cc7))
* new attributes + configure to readonly ([#4](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/4)) ([699ea56](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/699ea569886a24e62ae93c2235711e9a7c0866b2))
* reload geoserver on NFS change (MAPCO-7825) ([#15](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/15)) ([b723d65](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/b723d65a8a3eeb7035d8d7f07d123e406f9b8266))
* telemetry envs ([#12](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/12)) ([1170b7a](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/1170b7acefd46daf8ea9646bf97483d693ab8c30))
* this first PR implement the basic logic of configure geoserver as wfs service for PP ([#1](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/1)) ([4fb5490](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/4fb5490479da1db8ab9a9ed1f86c2999e7aa5947))
* Update side car and helm (MAPCO-4963) ([#9](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/9)) ([b14729c](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/b14729c61c4319aa6562c57c82dc38b2fe347532))
* update workflows and configurations for maintenance and node version (MAPCO-9820) ([#19](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/19)) ([dc63f42](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/dc63f4282178df4d17a75e036c79195d26adbcdb))


### Bug Fixes

* add configMap ([#13](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/13)) ([659932f](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/659932fed453826c84a2bec2f1f7a8e9eec51ee7))
* change naming of release products ([#2](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/2)) ([608543d](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/608543da6afff339b566db3c9a145eb8b278dcd7))
* client max body size ([#14](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/14)) ([34907b9](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/34907b98a3b56fe61fad45e7ccf3a9c324accd3e))
* get LayerName as original productId and Type from catalog(MAPCO-5241) ([#10](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/10)) ([b118dd9](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/b118dd9ec543afc85af6fe69fa19070a3bdd1cd9))
* helm modifications ([#8](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/8)) ([65f7155](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/65f7155e11cc40d0dd7f87b114083fdac1f77d3a))
* log ([#11](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/11)) ([25be8ae](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/25be8ae46cc5ae20ab14307312f5259b32af568c))
* remove proxy hide headers cors ([#16](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/16)) ([a7ca382](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/a7ca382ad6a27f8a5f26401eabd566e3957db112))
* workflow ([8f0e937](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/8f0e9371f539276cf3e4a092570d9ad523fade96))


### Helm Changes

* add infra mclabels and annotations MAPCO-9060 ([#17](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/17)) ([14b0287](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/14b0287f9c2114c4f62680c8649a52a02aaaa9ec))


### Code Refactoring

* times value should be entire lower cases ([#6](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/6)) ([fe32866](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/fe32866aa06da63844bcafc49e36363b7c8d47fd))
* use global db credentials ([#3](https://github.com/MapColonies/geoserver-wfs-yahalom/issues/3)) ([052d3c8](https://github.com/MapColonies/geoserver-wfs-yahalom/commit/052d3c8e89fb05bb18da514752a65084af0fc086))
