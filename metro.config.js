const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable resolution of `.cjs` files (required by Firebase Auth with Hermes)
if (config.resolver && Array.isArray(config.resolver.sourceExts)) {
  if (!config.resolver.sourceExts.includes('cjs')) {
    config.resolver.sourceExts.push('cjs');
  }
} else {
  config.resolver = {
    sourceExts: ['cjs'],
  };
}

// Workaround for Metro + Firebase packageExports issue (see https://ran-bajra.medium.com/fixing-component-auth-has-not-been-registered-yet-in-react-native-firebase-auth-hermes-26480a12107d)
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' }); 