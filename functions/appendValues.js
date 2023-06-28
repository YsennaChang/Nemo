const {google} = require('googleapis');
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

module.exports.appendValues = async (spreadsheetId, range, values)=> {

  const service = google.sheets({version: 'v4', auth});

  try {
    const result = await service.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption : 'USER_ENTERED',
      insertDataOption : 'INSERT_ROWS',
      resource : {
        values
      },
    });
    console.log(`${result.data.updates.updatedCells} cells appended.`);
    return result;
  } catch (err) {
    // TODO (Developer) - Handle exception
    throw err;
  }
}