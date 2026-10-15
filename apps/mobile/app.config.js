// Config dinámica de Expo: inyecta las claves de Google Maps desde .env
// (la sintaxis "process.env.X" como string en app.json NO se expande;
//  debe hacerse aquí, donde process.env es JavaScript real).
module.exports = ({ config }) => {
  const plugins = [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID ?? '',
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS ?? '',
      },
    ],
  ];

  return { ...config, plugins };
};
