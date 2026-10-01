const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const workspaceRoot = path.resolve(__dirname, '../../');
const sharedRoot = path.resolve(__dirname, '../../packages/shared');

const config = getDefaultConfig(__dirname);

// Monorepo: observar el paquete compartido fuera del proyecto Expo
config.watchFolders = [sharedRoot];

// Resolver dependencias desde el root de los workspaces (hoisting de npm)
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, { input: './src/global.css' });