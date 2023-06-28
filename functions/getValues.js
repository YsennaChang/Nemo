const { google } = require('googleapis');
const credentialsJSON = require("../credentials.json");
const tokenJSON = require("../token.json");

// Créer un client OAuth2
const auth = new google.auth.OAuth2(
  credentialsJSON["web"]["client_id"],
  credentialsJSON["web"]["client_secret"],
  credentialsJSON["web"]["redirect_uris"][0]
);

// Autoriser l'accès au compte Google
const credentials = {
  access_token: tokenJSON["access_token"],
  refresh_token: tokenJSON["refresh_token"],
  scope: 'https://www.googleapis.com/auth/spreadsheets',
  token_type: 'Bearer',
  expiry_date: tokenJSON["expiry_date"],
};
auth.setCredentials(credentials);

// Récupération des données

module.exports.getValues = async (spreadsheetId, sheetName, Params)=> {
  const filterParams = Params ? Params : [];

  const sheets = google.sheets({ version: 'v4', auth });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })

  // Transformer le tableau en tableau d'objets
  const headers = result.data.values.shift();
  const objects = result.data.values.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  // Filtre les résultats pour ne garder que les lignes avec la valeur param.value dans la colonne param.prop
  return filteredObjects = objects.filter(obj => {
    return filterParams.every(param => obj[param.prop] === param.value);
  });
}