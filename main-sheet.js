var MAIN_SHEET_NAME = 'Initial Registration Sheet';
var MAIN_SHEET_EMAIL_COLUMN = 'B';
var MAIN_SHEET_TIMESTAMP_COLUMN = 'A';
var REMINDER_DELAY_MILLISECONDS = 3600000; // How many milliseconds before reminder people to send in their public links!

var MAIN_SHEET_LINK_COLUMN = 'C';
var MAIN_SHEET_SENT_COLUMN = 'D';
var MAIN_SHEET_REMINDER_COLUMN = 'E';
var MAIN_SHEET_CHECKBOX_COLUMN = 'F';

var MAIN_SHEET_REMINDER_COLUMN_NAME = 'Reminder Count (Sent So Far)';
var MAIN_SHEET_EMAIL_COLUMN_NAME = 'EMAIL PLEASE';
var MAIN_SHEET_LINK_COLUMN_NAME = 'Public Link';
var MAIN_SHEET_SENT_COLUMN_NAME = 'Sent Approval Email?';

var MAIN_SHEET_SENT_COLUMN_VAL = 'Sent';

var QWIKLAB_EMAIL_SUBJECT = 'Test Qwiklabs Email';
var QWIKLAB_EMAIL_HTML_BODY = '<a href="https://www.qwiklabs.com/">Visit Qwiklabs here</a>';

var COURSERA_EMAIL_SUBJECT = 'Test Coursera Email';
var COURSERA_EMAIL_HTML_BODY = '<a href="https://www.coursera.com/">Visit Coursera here</a>';

var REMINDER_EMAIL_SUBJECT = 'Test Reminder Email';
var REMINDER_EMAIL_HTML_BODY = '<h1>You have not</h1> submitted your qwiklabs profile. Remember to submit it';

var SENDGRID_KEY = 'REDACTED';
var SENDGRID_EMAIL_SENDER = 'REDACTED';
var SENDGRID_SEND_API = 'https://api.sendgrid.com/v3/mail/send';

var CHECKBOX_RULE = SpreadsheetApp.newDataValidation().requireCheckbox().build();

function init() {
  const currentSheet = SpreadsheetApp.getActive();
  setupEmailTrigger(currentSheet);
  renameInitialSheet(currentSheet);
  setupInitialSheetColumn(currentSheet);
  setupCronTrigger();
}

function onFormSubmit(e) {
  // Prep and send email
  const email = e.namedValues[MAIN_SHEET_EMAIL_COLUMN_NAME][0]
  const htmlBody = '<a href="https://www.qwiklabs.com/">Visit Qwiklabs here</a>';
  sendEmail(email, QWIKLAB_EMAIL_SUBJECT, QWIKLAB_EMAIL_HTML_BODY)
  
  // Add checkbox
  const row = e.range.getRow();
  const currentSpreadsheet = SpreadsheetApp.getActive();
  const mainSheet = currentSpreadsheet.getSheetByName(MAIN_SHEET_NAME);
  const cell = mainSheet.getRange(MAIN_SHEET_CHECKBOX_COLUMN + row);
  cell.setDataValidation(CHECKBOX_RULE);
}

function setupEmailTrigger(activeSpreadsheet) {
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(activeSpreadsheet)
    .onFormSubmit()
    .create();
}

function renameInitialSheet(activeSpreadsheet) {
  const mainSheet = activeSpreadsheet.getSheets()[0];
  mainSheet.setName(MAIN_SHEET_NAME);
}

function setupInitialSheetColumn(activeSpreadsheet) {
  const mainSheet = activeSpreadsheet.getSheetByName(MAIN_SHEET_NAME);
  mainSheet.getRange(MAIN_SHEET_SENT_COLUMN+'1').setValue(MAIN_SHEET_SENT_COLUMN_NAME);
  mainSheet.getRange(MAIN_SHEET_LINK_COLUMN+'1').setValue(MAIN_SHEET_LINK_COLUMN_NAME);
  mainSheet.getRange(MAIN_SHEET_REMINDER_COLUMN+'1').setValue(MAIN_SHEET_REMINDER_COLUMN_NAME);
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

/**********************************************/
/* UI SIDEBAR STUFF                           */
/**********************************************/
function onInstall(e) {
  onOpen(e);
  init();
}

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Trigger Approval Email UI', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Approval Email UI');
  SpreadsheetApp.getUi().showSidebar(ui);
}

function triggerEmailToChecked() {
  const currentSpreadsheet = SpreadsheetApp.getActive();
  const mainSheet = currentSpreadsheet.getSheetByName(MAIN_SHEET_NAME);
  const dataRange = mainSheet.getRange(MAIN_SHEET_CHECKBOX_COLUMN + '2:' + MAIN_SHEET_CHECKBOX_COLUMN);
  const values = dataRange.getValues();
  
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j] == true) {
        var row = i + 2;
        var email = mainSheet.getRange(MAIN_SHEET_EMAIL_COLUMN + '' + row).getValue();
        sendEmail(email, COURSERA_EMAIL_SUBJECT, COURSERA_EMAIL_HTML_BODY);
        mainSheet.getRange(MAIN_SHEET_SENT_COLUMN + "" + row).setValue(MAIN_SHEET_SENT_COLUMN_VAL);
      }
    }
  }
  
  uncheckAll();
}

function uncheckAll() {
  const currentSpreadsheet = SpreadsheetApp.getActive();
  const mainSheet = currentSpreadsheet.getSheetByName(MAIN_SHEET_NAME);
  const dataRange = mainSheet.getRange(MAIN_SHEET_CHECKBOX_COLUMN + '2:' + MAIN_SHEET_CHECKBOX_COLUMN);
  const values = dataRange.getValues();
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      if (values[i][j] == true) {
        values[i][j] = false;
      }
    }
  }
  
  dataRange.setValues(values);
}

/*********************************************/
/* CRON . MHNNNNNN TASTY                     */
/*********************************************/

function setupCronTrigger() {
  ScriptApp.newTrigger('cronJob')
    .timeBased()
    .everyHours(1)
    .create();
}

function cronJob() {
  const currentSpreadsheet = SpreadsheetApp.getActive();
  const mainSheet = currentSpreadsheet.getSheetByName(MAIN_SHEET_NAME);
  const linkDataRange = mainSheet.getRange(MAIN_SHEET_LINK_COLUMN + '2:' + MAIN_SHEET_LINK_COLUMN);
  const values = linkDataRange.getValues();
  const nowTime = new Date();
  
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < values[i].length; j++) {
      var row = i + 2;
      var tsCellRange = mainSheet.getRange(MAIN_SHEET_TIMESTAMP_COLUMN + '' + row);
      var ts = tsCellRange.getValue();
      
      // Reached end, break
      if (ts == '') {
        break;
      }
      // Link already received, continue to next row
      if (values[i][j] != '') {
        continue; 
      }
      
      var tsDate = new Date(ts);
      var offset = nowTime - tsDate;
      if (offset > REMINDER_DELAY_MILLISECONDS) {
        var reminderCellRange = mainSheet.getRange(MAIN_SHEET_REMINDER_COLUMN + '' + row)
        var count = reminderCellRange.getValue();
        
        if (count == '') {
          count = 1;
        } else {
          count += 1; 
        }
        reminderCellRange.setValue(count);
        sendEmail(email, REMINDER_EMAIL_SUBJECT, REMINDER_EMAIL_HTML_BODY);
        tsCellRange.setValue(nowTime); // Update timestamp to current time (avoid spamming the user again under the reminder delay timing lapse again)
      }
    }
  }
  
}