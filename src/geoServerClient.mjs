import * as zx from 'zx';

export class GeoServerClient {
  constructor(geoserverBaseUrl, geoserverLocalBaseUrl, workspaceName, dataStoreName, user, password) {
    this.workspaceName = workspaceName;
    this.dataStoreName = dataStoreName;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    this.restApiBaseUrl = `${geoserverBaseUrl}/rest`;
    this.workspaceApiUrl = `${this.restApiBaseUrl}/workspaces`;
    this.dataStoreApiUrl = `${this.workspaceApiUrl}/${workspaceName}/datastores`;
    this.featureTypesApiUrl = `${this.dataStoreApiUrl}/${dataStoreName}/featuretypes`;
    this.globalWfsSettingApiUrl = `${this.restApiBaseUrl}/services/wfs/settings`;
    this.geoserverLocalReloadUrl = `${geoserverLocalBaseUrl}/rest/reload`;
  }

  async getGeoServerStatus() {
    return this.#request(this.globalWfsSettingApiUrl, { method: 'GET' });
  }

  async setWfsServiceLevelToBasic() {
    return this.#request(this.globalWfsSettingApiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wfs: {
          serviceLevel: 'BASIC',
          maxFeatures: 1000,
        },
      }),
    });
  }

  async getWorkspace() {
    return this.#request(`${this.workspaceApiUrl}/${this.workspaceName}`, { method: 'GET' });
  }

  async createWorkspace(workspaceName) {
    const createWorkspaceBody = {
      workspace: {
        name: `${workspaceName}`,
      },
    };

    return this.#request(this.workspaceApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createWorkspaceBody),
    });
  }

  async getDataStore(dataStoreName) {
    return this.#request(`${this.dataStoreApiUrl}/${dataStoreName}`, { method: 'GET' });
  }

  async createDataStore(dataStoreName, dataStoreBody) {
    const datastore = dataStoreBody;
    const connectionParameters = [
      { '@key': 'host', $: dataStoreBody.host },
      { '@key': 'port', $: dataStoreBody.port.toString() },
      { '@key': 'database', $: dataStoreBody.dbName },
      { '@key': 'user', $: dataStoreBody.username },
      { '@key': 'dbtype', $: dataStoreBody.dbType },
      { '@key': 'schema', $: dataStoreBody.schema },
      { '@key': 'SSL mode', $: dataStoreBody.sslMode },
      { '@key': 'validate connections', $: 'true' },
      { '@key': 'Expose primary keys', $: 'true' },
    ];

    if (dataStoreBody.password != null && dataStoreBody.password.trim() !== '') {
      connectionParameters.push({ '@key': 'passwd', $: dataStoreBody.password });
    }

    const createDataStoreBody = {
      dataStore: {
        name: dataStoreName,
        enabled: true,
        disableOnConnFailure: true,
        connectionParameters: {
          entry: connectionParameters,
        },
      },
    };

    return this.#request(this.dataStoreApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createDataStoreBody),
    });
  }

  async getFeatureTypes(listType) {
    const validListTypes = new Set(['all', 'configured', 'available', 'available_with_geom']);
    if (!validListTypes.has(listType)) {
      throw new Error(`Invalid list type: ${listType}. Expected one of: all, configured, available, available_with_geom`);
    }

    const params = new URLSearchParams();
    params.append('list', listType);
    const response = await this.#request(`${this.featureTypesApiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const jsonResponse = await response.json();
    const featureTypes = this.GetFeatureTypesResponse(listType, jsonResponse);
    return featureTypes;
  }

  GetFeatureTypesResponse(listType, geoserverResponse) {
    if (listType === 'configured') {
      if (!geoserverResponse.featureTypes.featureType) {
        return [];
      }
      return geoserverResponse.featureTypes.featureType.map((feature) => ({
        name: feature.name,
        link: feature.href,
      }));
    }
    // else
    if (!geoserverResponse.list.string) {
      return [];
    }
    return geoserverResponse.list.string.map((featureName) => ({
      name: featureName,
    }));
  }

  async createFeatureType(body) {
    const normalizedBody = body?.featureType ? body : { featureType: body };

    return this.#request(this.featureTypesApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(normalizedBody),
    });
  }

  async reloadGeoServer() {
    return this.#request(this.geoserverLocalReloadUrl, { method: 'POST' });
  }

  async #request(url, options = {}) {
    const headers = {
      Authorization: this.authHeader,
      ...(options.headers ?? {}),
    };

    return zx.fetch(url, {
      ...options,
      headers,
    });
  }
}
