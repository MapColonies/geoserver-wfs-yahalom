import * as zx from 'zx';

export class GeoServerClient {
  constructor(geoserverBaseUrl, geoserverLocalBaseUrl, geoserverApiBaseUrl, workspaceName, dataStoreName, user, password) {
    this.geoserverBaseUrl = geoserverBaseUrl;
    this.workspaceName = workspaceName;
    this.dataStoreName = dataStoreName;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    this.workspaceApiUrl = `${geoserverApiBaseUrl}/workspaces`;
    this.dataStoreApiUrl = `${geoserverApiBaseUrl}/dataStores/${workspaceName}`;
    this.featureTypesApiUrl = `${geoserverApiBaseUrl}/featureTypes/${workspaceName}/${dataStoreName}`;
    this.globalWfsSettingApiUrl = `${geoserverApiBaseUrl}/services/wfs/settings`;
    this.geoserverLocalReloadUrl = `${geoserverLocalBaseUrl}/rest/reload`;
  }

  async getGeoServerStatus() {
    return this.#request(this.geoserverBaseUrl, { method: 'GET' });
  }

  async setWfsServiceLevel(serviceLevel) {
    return this.#request(this.globalWfsSettingApiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceLevel }),
    });
  }

  async getWorkspace() {
    return this.#request(`${this.workspaceApiUrl}/${this.workspaceName}`, { method: 'GET' });
  }

  async createWorkspace(body) {
    return this.#request(this.workspaceApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async getDataStore() {
    return this.#request(`${this.dataStoreApiUrl}/${this.dataStoreName}`, { method: 'GET' });
  }

  async createDataStore(body) {
    return this.#request(this.dataStoreApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async getFeatureTypes(listType) {
    const params = new URLSearchParams();
    params.append('list', listType);
    const response = await this.#request(`${this.featureTypesApiUrl}?` + params, { method: 'GET' });
    return response.json();
  }

  async createFeatureType(body) {
    return this.#request(this.featureTypesApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
