var MAIN_SHEET_ID = 'REDACTED';

var MAIN_SHEET_EMAIL_COLUMN = 'B';
var MAIN_SHEET_LINK_COLUMN = 'C';

var QWIKLAB_LINK_PROVISION_EMAIL_SUBJECT = 'Qwiklabs link received!';
var QWIKLAB_LINK_PROVISION_EMAIL_HTML_BODY = '<h1>We received</h1> your link! Thanks';

var SIDE_SHEET_EMAIL_COLUMN_NAME = 'Email (Same used to register before)';
var SIDE_SHEET_LINK_COLUMN_NAME = 'Public Qwiklabs Profile Link';

var SENDGRID_KEY = 'REDACTED';
var SENDGRID_EMAIL_SENDER = 'REDACTED';
var SENDGRID_SEND_API = 'https://api.sendgrid.com/v3/mail/send';

function init() {
  const currentSheet = SpreadsheetApp.getActive();
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(currentSheet)
    .onFormSubmit()
    .create();
}

function onFormSubmit(e) {
  const email = e.namedValues[SIDE_SHEET_EMAIL_COLUMN_NAME][0];
  const link = e.namedValues[SIDE_SHEET_LINK_COLUMN_NAME][0];

  const mainSheet = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const mainLinkDataRange = mainSheet.getRange(MAIN_SHEET_EMAIL_COLUMN + '2:' + MAIN_SHEET_EMAIL_COLUMN);
  const mainLinkValues = mainLinkDataRange.getValues();
  
  for (var i = 0; i < mainLinkValues.length; i++) {
    for (var j = 0; j < mainLinkValues[i].length; j++) {
      var row = i + 2;
      // Set link if the email matches
      if (mainLinkValues[i][j] === email) {
        mainSheet.getRange(MAIN_SHEET_LINK_COLUMN + '' + row)
          .setValue(link);
      }
    }
  }
  
  sendEmail(email, QWIKLAB_LINK_PROVISION_EMAIL_SUBJECT, QWIKLAB_LINK_PROVISION_EMAIL_HTML_BODY)
}

function sendEmail(email, subject, htmlBody) {
  const headers = {
    "Authorization" : "Bearer " + SENDGRID_KEY, 
    "Content-Type": "application/json" 
  }

  const body = {
    "personalizations": [{
      "to": [{
        "email": email,
      }],
      "subject": subject,
    }],
    "from": {
      "email": SENDGRID_EMAIL_SENDER,
    },
    "content": [{
      "type": "text/html",
      "value": htmlBody,
    }],
  };

  const options = {
    'method':'post',
    'headers':headers,
    'payload':JSON.stringify(body)
  };

  const response = UrlFetchApp.fetch(SENDGRID_SEND_API, options); 
}