const {google} = require('googleapis');
const credentialsJSON = require("../credentials.json");
const tokenJSON = require("../token.json");
const { getValues } = require('./getValues');

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

const getSheetId = async (spreadsheetId, sheetName) => {
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [sheetName],
    fields: 'sheets.properties.sheetId,sheets.properties.title'
  });

  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  if (sheet) {
    return sheet.properties.sheetId;
  } else {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
}

module.exports.update = async (spreadsheetId, sheet, arrayToCompare, newValue, columnToModify)=> {
  const service = google.sheets({version: 'v4', auth});
  const sheetId = await getSheetId(spreadsheetId, sheet);
  const rows = await getValues(spreadsheetId, sheet)
  let toUpdateRow;
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    let match = true;
    for (let i = 0; i < arrayToCompare.length; i++) {
        const { column, value } = arrayToCompare[i]
        if (row[column] !== value) {
            match = false

          break;
        }
    }
    if (match) {
        toUpdateRow = index + 1;
        break; // Exit the loop if a match is found
    }
  }

  const headerRow = Object.keys(rows[0]);
  const columnToModifyIndex = headerRow.indexOf(columnToModify);

  if (toUpdateRow){
    const request = {
        auth,
        spreadsheetId,
        resource: {
            "requests": [
              {
                "updateCells": {
                  "range": {
                    "sheetId": sheetId,
                    "startRowIndex": toUpdateRow,
                    "endRowIndex": toUpdateRow+1,
                    "startColumnIndex": columnToModifyIndex,
                    "endColumnIndex": columnToModifyIndex + 1,
                  },
                  "rows": [
                    {
                      "values": [
                        {
                          "userEnteredValue": {
                            [typeof newValue === 'number' ? 'numberValue' : 'stringValue']: newValue
                          }
                        }
                      ]
                    }
                  ],
                  "fields": "userEnteredValue"
                }
              }
            ]
        }
    };
    try {
      const result = await service.spreadsheets.batchUpdate(request);
      return result;
    } catch (err) {
      // TODO (Developer) - Handle exception
      throw err;
    }
  }
}