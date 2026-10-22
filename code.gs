/**
 * বারাকাহ ভিলা - Google Apps Script
 *
 * সেটআপ নির্দেশনা:
 * ১. একটি নতুন Google Sheet তৈরি করুন
 * ২. Extensions > Apps Script এ যান
 * ৩. এই কোড পেস্ট করুন এবং সেভ করুন
 * ৪. Deploy > New deployment > Web app
 * ৫. Execute as: Me, Who has access: Anyone
 * ৬. Web App URL কপি করে index.html এর সেটিংসে পেস্ট করুন
 */

const SHEET_NAME = 'হিসাব';
const HEADERS = ['ID', 'তারিখ', 'নাম', 'মোবাইল', 'কাজের নাম', 'পরিমাণ', 'নোট', 'সময়'];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    // Format
    sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
    sheet.setColumnWidth(1, 120); // ID
    sheet.setColumnWidth(2, 100); // তারিখ
    sheet.setColumnWidth(3, 180); // নাম
    sheet.setColumnWidth(4, 130); // মোবাইল
    sheet.setColumnWidth(5, 200); // কাজ
    sheet.setColumnWidth(6, 100); // পরিমাণ
    sheet.setColumnWidth(7, 200); // নোট
    sheet.setColumnWidth(8, 160); // সময়
  }
  return sheet;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data;

    let result;
    switch(action) {
      case 'save':
        result = saveEntry(data);
        break;
      case 'update':
        result = updateEntry(data);
        break;
      case 'delete':
        result = deleteEntry(data.id);
        break;
      case 'test':
        result = { ok:true, message:'সংযোগ সফল' };
        break;
      case 'refresh':
        result = { ok:true };
        break;
      default:
        result = { ok:false, error:'Unknown action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error:err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : '';
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    const result = action === 'load' || action === 'refresh'
      ? { ok:true, entries:getEntries() }
      : { ok:true, message:'বারাকাহ ভিলা API সক্রিয়' };

    if (callback) {
      if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
        throw new Error('Invalid JSONP callback');
      }
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    const result = { ok:false, error:err.toString() };
    if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
      return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getEntries() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const timeZone = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues()
    .filter(row => row[0] !== '' && row[0] != null)
    .map(row => ({
      id:String(row[0]),
      date:row[1] instanceof Date
        ? Utilities.formatDate(row[1], timeZone, 'yyyy-MM-dd')
        : String(row[1] || ''),
      name:String(row[2] || ''),
      mobile:String(row[3] || ''),
      work:String(row[4] || ''),
      amount:Number(row[5]) || 0,
      note:String(row[6] || ''),
      createdAt:row[7] instanceof Date ? row[7].getTime() : row[7]
    }));
}

function saveEntry(data) {
  const sheet = getSheet();
  const row = [
    data.id || generateId(),
    data.date || '',
    data.name || '',
    data.mobile || '',
    data.work || '',
    Number(data.amount) || 0,
    data.note || '',
    new Date().toISOString()
  ];
  sheet.appendRow(row);

  // Sort sheet after save (by name then by work)
  sortSheet(sheet);

  return { ok:true, id:row[0] };
}

function updateEntry(data) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(data.id)) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(data.date || '');
      sheet.getRange(rowNum, 3).setValue(data.name || '');
      sheet.getRange(rowNum, 4).setValue(data.mobile || '');
      sheet.getRange(rowNum, 5).setValue(data.work || '');
      sheet.getRange(rowNum, 6).setValue(Number(data.amount) || 0);
      sheet.getRange(rowNum, 7).setValue(data.note || '');
      sheet.getRange(rowNum, 8).setValue(new Date().toISOString());

      sortSheet(sheet);
      return { ok:true };
    }
  }
  return { ok:false, error:'Entry not found' };
}

function deleteEntry(id) {
  const sheet = getSheet();
  const allData = sheet.getDataRange().getValues();

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok:true };
    }
  }
  return { ok:false, error:'Entry not found' };
}

function sortSheet(sheet) {
  // Sort by: Column C (name) ascending, then Column E (work) ascending
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const range = sheet.getRange(2, 1, lastRow - 1, 8);
  range.sort([
    { column: 3, ascending: true },  // নাম
    { column: 5, ascending: true }   // কাজের নাম
  ]);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2,5);
}

/**
 * ম্যানুয়াল টেস্ট ফাংশন (Apps Script editor থেকে Run করুন)
 */
function testSetup() {
  const sheet = getSheet();
  Logger.log('Sheet ready: ' + sheet.getName());
  Logger.log('Headers: ' + sheet.getRange(1,1,1,HEADERS.length).getValues()[0].join(', '));
}

/**
 * সব এন্ট্রি দেখুন
 */
function viewAllEntries() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  Logger.log('মোট এন্ট্রি: ' + (data.length - 1));
  data.forEach((row, i) => {
    if (i > 0) Logger.log(row.join(' | '));
  });
}