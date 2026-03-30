const { withXcodeProject } = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");

function withStoreKitConfig(config, { storeKitConfigPath } = {}) {
  const configPath = storeKitConfigPath || "./CentsibleScholar.storekit";

  return withXcodeProject(config, async (config) => {
    const projectName = config.modRequest.projectName;
    const absolutePath = path.resolve(config.modRequest.projectRoot, configPath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`StoreKit config not found at ${absolutePath}, skipping.`);
      return config;
    }

    const targetDir = path.join(config.modRequest.platformProjectRoot, projectName);
    const targetPath = path.join(targetDir, "CentsibleScholar.storekit");

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.copyFileSync(absolutePath, targetPath);
    console.log(`Copied StoreKit config to ${targetPath}`);

    return config;
  });
}

module.exports = withStoreKitConfig;
