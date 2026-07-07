import * as zx from 'zx';

export class GeoServerClient {
  constructor(geoserverBaseUrl, geoserverLocalBaseUrl, geoserverApiBaseUrl, workspaceName, dataStoreName, user, password) {
    this.geoserverBaseUrl = geoserverBaseUrl;
    this.workspaceName = workspaceName;
    this.dataStoreName = dataStoreName;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    this.restApiBaseUrl = `${geoserverApiBaseUrl}/rest`;
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
      name: workspaceName,
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

  async createDataStore(dataStoreName) {
    const createDataStoreBody = {
      name: dataStoreName,
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
    const response = await this.#request(`${this.featureTypesApiUrl}?${params.toString()}`, { method: 'GET' });
    return response.json();
  }

  async createFeatureType(body) {
    const normalizedBody = body?.featureType ? body : { featureType: body };

    return this.#request(this.featureTypesApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
