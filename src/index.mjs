import * as chokidar from 'chokidar';
import { stat } from 'fs/promises';
import * as zx from 'zx';
import { ok as assertOk } from 'assert';
import env from 'env-var';
import 'dotenv/config';
import jsLogger from '@map-colonies/js-logger';
import { ProductType } from '@map-colonies/mc-model-types';
import { GeoServerClient } from './geoServerClient.mjs';

// *******************************************************************
// *************** initialization of environ variables ***************
// *******************************************************************
const logger = jsLogger.default({
  level: env.get('LOG_LEVEL').default('info').asString(),
  prettyPrint: env.get('LOG_PRETTY').default('false').asBool(),
});

const GEOSERVER_LOCAL_PORT = '8080'; // Default port for local GeoServer instance, hard coded in deployment.yaml containerPort
const POLLING_INTERVAL_MS = env.get('POLLING_INTERVAL_MS').default(3000).asIntPositive(); // Polling interval in milliseconds
const GEOSERVER_BASE_URL = env.get('GEOSERVER_BASE_URL').default('https://query-3d-dev.mapcolonies.net/api/yahalom/v1/layers').asString();
const GEOSERVER_LOCAL_BASE_URL = `http://localhost:${GEOSERVER_LOCAL_PORT}/geoserver`;

const WORKSPACE_NAME = env.get('WORKSPACE_NAME').default('yahalom').asString();
const DATASTORE_NAME = env.get('DATASTORE_NAME').default('yahalom').asString();
const DATASTORE_BODY = {
  username: env.get('DATASTORE_USERNAME').default('postgres').asString(),
  password: env.get('DATASTORE_PASSWORD').default('postgres').asString(),
  host: env.get('DATASTORE_HOST').default('127.0.0.1').asString(),
  port: env.get('DATASTORE_PORT').default(5432).asIntPositive(),
  schema: env.get('DATASTORE_SCHEMA').default('public').asString(),
  dbName: env.get('DATASTORE_DB_NAME').default('test').asString(),
  dbType: env.get('DATASTORE_TYPE').default('postgis').asString(),
  sslMode: env.get('DATASTORE_SSL_MODE').default('DISABLE').asString(),
};
const GEOSERVER_DATA_DIR = env.get('GEOSERVER_DATA_DIR').default('/data_dir').asString();
const DATASTORE_PATH = `${GEOSERVER_DATA_DIR}/workspaces/${WORKSPACE_NAME}/${DATASTORE_NAME}`;

const FEATURE_TYPES_STRINGS_BLACK_LIST = env.get('FEATURE_TYPES_STRINGS_BLACK_LIST').default(['layer_objects', 'sync_state', 'migrations']).asJson();
const FEATURE_TYPES_REGEX_BLACK_LIST = env.get('FEATURE_TYPES_REGEX_BLACK_LIST').default(['.*_history$', '.*_valid$']).asJson();

const GEOSERVER_USER = env.get('GEOSERVER_ADMIN_USER').default('admin').asString();
const GEOSERVER_PASS = env.get('GEOSERVER_ADMIN_PASSWORD').default('geoserver').asString();

const geoServerClient = new GeoServerClient(
  GEOSERVER_BASE_URL,
  GEOSERVER_LOCAL_BASE_URL,
  WORKSPACE_NAME,
  DATASTORE_NAME,
  GEOSERVER_USER,
  GEOSERVER_PASS
);

// *******************GEOSERVER INITIALIZATION************************************************

//Loop until validate geoserver is up
try {
  logger.info({ msg: `Checking if GeoServer is up on ${GEOSERVER_BASE_URL}...` });
  await checkGeoserverIsUp();
} catch (error) {
  logger.error({ msg: `Failed to connect to GeoServer: ${error.message}, ${error}` });
  throw error;
}

//set wfs mode
try {
  logger.info({ msg: `Setting WFS service level to BASIC...` });
  await setWfsAsBasic();
} catch (error) {
  logger.error({ msg: `Failed to set WFS service level to BASIC: ${error.message}, ${error}` });
  throw error;
}

//check if workspace exists, if it doesnt - create one
try {
  logger.info({ msg: `Checking if workspace ${WORKSPACE_NAME} exists...` });
  const workspaceExists = await checkWorkspace();
  if (!workspaceExists) {
    try {
      logger.info({ msg: `Workspace ${WORKSPACE_NAME} does not exist. Creating...` });
      await createWorkspace();
    } catch (error) {
      logger.error({ msg: `Failed to create workspace: ${error.message}, ${error}` });
      throw error;
    }
  }
} catch (error) {
  logger.error({ msg: `Failed to check workspace existence: ${error.message}, ${error}` });
  throw error;
}

//check if dataStore exists, if it doesnt - create one
try {
  logger.info({ msg: `Checking if data store ${DATASTORE_NAME} exists...` });
  const dataStoreExists = await checkDataStore();
  if (!dataStoreExists) {
    try {
      logger.info({ msg: `Data store ${DATASTORE_NAME} does not exist. Creating...` });
      await createDataStore();
    } catch (error) {
      logger.error({ msg: `Failed to create data store: ${error.message}, ${error}` });
      throw error;
    }
  }
} catch (error) {
  logger.error({ msg: `Failed to check data store existence: ${error.message}, ${error}` });
  throw error;
}

//check featureLayers and publish them if needed
try {
  logger.info({ msg: `Checking and publishing feature types if needed...` });
  await checkFeatureTypes();
} catch (error) {
  logger.error({ msg: `Failed to check and publish feature types: ${error.message}, ${error}` });
  throw error;
}

logger.info({ msg: `Env ready: Completed Geoserver initialization` });

//listen to nfs changes
if (await isDataDirExists()) {
  const watcher = chokidar.watch(DATASTORE_PATH, {
    persistent: true,
    ignoreInitial: true,
    usePolling: true, // use polling to detect changes - optimized for NFS
    interval: POLLING_INTERVAL_MS, // how often to poll (in ms)
    binaryInterval: POLLING_INTERVAL_MS,
  });

  logger.info({ msg: `starts watching ${DATASTORE_PATH} path` });
  watcher
    .on('add', async (path) => {
      logger.info({ msg: `File added: ${path}` });
      await reloadGeoServer();
    })
    .on('unlink', async (path) => {
      logger.info({ msg: `File removed: ${path}` });
      await reloadGeoServer();
    })
    .on('ready', () => logger.info({ msg: 'Initial scan complete. Ready for changes' }))
    .on('error', (error) => logger.error({ msg: `Watcher error: ${error}` }));
} else {
  logger.error({ msg: `Data directory ${DATASTORE_PATH} does not exist or is not accessible` });
  throw new Error(`Data directory ${DATASTORE_PATH} does not exist or is not accessible`);
}
// *******************************************************************

async function reloadGeoServer() {
  try {
    logger.info({ msg: `Triggering geoserver reload on ${GEOSERVER_LOCAL_BASE_URL}/rest/reload...` });
    await geoServerClient.reloadGeoServer();
  } catch (error) {
    logger.warn({
      msg: `Failed connect to reload geoserver with error ${error}, will retry again`,
    });
    await zx.sleep(15000);
  }
}

async function isDataDirExists() {
  try {
    const stats = await stat(DATASTORE_PATH);
    const isDirectory = stats.isDirectory();
    if (isDirectory) {
      logger.info({ msg: `successfully checked ${DATASTORE_PATH} is a directory` });
      return true;
    } else {
      logger.error({ msg: `${DATASTORE_PATH} is not a directory` });
      return false;
    }
  } catch (err) {
    logger.error({ msg: `Error checking data directory ${DATASTORE_PATH}: ${err.message}` });
    throw err;
  }
}

/**
 * This function will check periodically till detect that geoserver is up and than exit the method
 */
async function checkGeoserverIsUp() {
  while (true) {
    try {
      const responseFromGs = await geoServerClient.getGeoServerStatus();
      logger.info({
        msg: `Got response from geoserver with status code: ${responseFromGs.status}`,
      });
      assertOk(responseFromGs.status === 200);
      break;
    } catch (error) {
      logger.warn({
        msg: `Failed connect to geoserver with error ${error}, will retry again`,
      });
      await zx.sleep(15000);
    }
  }
}

/**
 * Send api to check if the workspace exists
 */
async function checkWorkspace() {
  const getWorkspaceResp = await geoServerClient.getWorkspace();

  logger.info({ msg: await getWorkspaceResp.text() });

  await zx.sleep(1000);
  if (getWorkspaceResp.status === 200) {
    return true;
  } else if (getWorkspaceResp.status === 404) {
    return false;
  } else {
    throw new Error(`Unexpected status code: ${getWorkspaceResp.status}`);
  }
}

async function createWorkspace() {
  const createWorkspaceResp = await geoServerClient.createWorkspace(WORKSPACE_NAME);
  const responseText = await createWorkspaceResp.text();
  logger.info({ msg: responseText });

  assertOk(createWorkspaceResp.status === 201);
  logger.info({
    msg: `Created workspace: ${WORKSPACE_NAME}  successfully`,
  });

  await zx.sleep(1000);
}

/**
 * Send api to check if the workspace exists, if not create one
 */
async function checkDataStore() {
  const getDataStoreResp = await geoServerClient.getDataStore(DATASTORE_NAME);
  const responseText = await getDataStoreResp.text();
  logger.info({ msg: responseText });

  await zx.sleep(1000);
  if (getDataStoreResp.status === 200) {
    return true;
  } else if (getDataStoreResp.status === 404) {
    return false;
  } else {
    throw new Error(`Unexpected status code: ${getDataStoreResp.status}`);
  }
}

async function createDataStore() {
  const createDataStoreResp = await geoServerClient.createDataStore(DATASTORE_NAME, DATASTORE_BODY);

  logger.info({ msg: await createDataStoreResp.text() });

  assertOk(createDataStoreResp.status === 201);
  logger.info({
    msg: `Created dataStore: ${DATASTORE_NAME}  successfully`,
  });

  await zx.sleep(1000);
}

/**
 * compare get list configured and get available - if create feature types of all that are available and not configured
 */
async function checkFeatureTypes() {
  const availableNames = await getAvailableFeatureTypes();
  const mappedLayerNames = await mapNativeNameToLayerName(availableNames);

  if (mappedLayerNames.length === 0) {
    logger.info({ msg: ' There are no layers to publish! ' });
  } else {
    const postRequests = mappedLayerNames.map(async (entity) => {
      try {
        const response = await geoServerClient.createFeatureType({ nativeName: entity.nativeName, name: entity.layerName });
        if (!response.ok) {
          throw new Error(
            `Failed to POST for table:${entity.nativeName} with layerName: ${entity.layerName}: ${response.status} ${response.statusText}`
          );
        }
        logger.info({ msg: `Successfully posted for table:${entity.nativeName} with layerName: ${entity.layerName}` });
      } catch (error) {
        // Log detailed error message for the failed request
        logger.error({ msg: `Error posting for table:${entity.nativeName} with layerName: ${entity.layerName}: ${error}` });
        throw error; // Re-throw the error to ensure it is caught by Promise.all
      }
    });
    try {
      await Promise.all(postRequests);
      logger.info({ msg: 'All POST requests were successful' });
    } catch (error) {
      logger.error({ msg: `One or more POST requests failed: ${error}` });
      throw Error(error);
    }
  }
  await zx.sleep(1000);
}

/**
 * Send api request for global settings - restrict WFS protocol read-only (BASIC)
 */
async function setWfsAsBasic() {
  const wfsModeResponse = await geoServerClient.setWfsServiceLevelToBasic();

  logger.info({ msg: await wfsModeResponse.text() });
  assertOk(wfsModeResponse.status === 200);
  logger.info({
    msg: `Set WFS service level into 'BASIC' - read only mode with status code: ${wfsModeResponse.status}`,
  });
}

async function getAvailableFeatureTypes() {
  try {
    const availableLayers = await geoServerClient.getFeatureTypes('available');
    const availableNames = availableLayers
    .filter((layer) => {
      const isInBlacklist = FEATURE_TYPES_STRINGS_BLACK_LIST.includes(layer.name);
      const matchesRegexBlacklist = FEATURE_TYPES_REGEX_BLACK_LIST.some((regex) => new RegExp(regex).test(layer.name));
      return !isInBlacklist && !matchesRegexBlacklist;
    })
    .map((layer) => layer.name);
    logger.info({ msg: `availableNames: ${availableNames}` });
    await zx.sleep(1000);
    return availableNames;
  } catch (error) {
    logger.error({ msg: `Error fetching available feature types: ${error.message}, ${error}` });
    throw error; // Re-throw the error to ensure it is caught by the caller
  }
}

async function getConfiguredFeatureTypes() {
  const configuredLayers = await geoServerClient.getFeatureTypes('configured');
  const configuredNames = configuredLayers.map((layer) => layer.name);

  logger.debug({ msg: `configuredNames: ${configuredNames}` });
  await zx.sleep(1000);
  return configuredNames;
}

async function mapNativeNameToLayerName(availableNames) {
  let configuredLayers;
  try {
    configuredLayers = await getConfiguredFeatureTypes();
  } catch (error) {
    logger.error({ msg: `Error fetching configured feature types: ${error.message}, ${error}` });
    throw error; // Re-throw the error to ensure it is caught by the caller
  }
  const layersMapping = await Promise.all(
    availableNames.map(async (nativeName) => {
      const layerName = splitNativeLayer(nativeName);
      try {
        /* getAvailable returns the tableNames. 
      Due to the fact that we are publishing the features in a different name from 
      the tableName, the available returns  some already published layers
      so we want to get the configuredLayers and check that the layer name is not in it*/
        if (!configuredLayers.includes(layerName)) {
          return { nativeName, layerName };
        }
        return undefined;
      } catch (error) {
        logger.error({ msg: `Error processing ${nativeName}: ${error.message}` });
        return undefined;
      }
    })
  );
  //filter out undefined values returned from the mapping
  return layersMapping.filter((result) => result);
}

function splitNativeLayer(name) {
  const lastUnderscoreIndex = name.indexOf('_');

  name.slice(0, lastUnderscoreIndex);
  const layerName = name.slice(lastUnderscoreIndex + 1);
  return layerName;
}

function findProductType(input) {
  // Normalize the input by converting it to lowercase
  const formattedInput = input.toLowerCase();

  // Loop through the enum values
  return Object.values(ProductType).find((value) => {
    // Normalize the enum value by converting it to lowercase and removing underscores
    const normalizedEnumValue = value.toLowerCase().replace(/_/g, '');
    return normalizedEnumValue === formattedInput;
  });
}
