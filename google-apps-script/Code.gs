const SHEET_NAME = 'RSVP';
const GMAIL_PATTERN = /^[A-Z0-9._%+-]+@gmail\.com$/i;
const SHEET_HEADERS = [
  'STT',
  'Họ và tên',
  'Tham dự lễ tốt nghiệp',
  'Tham dự tiệc ăn mừng',
  'Năm sinh',
  'Email',
  'Nhắn nhủ',
  'Thời gian gửi',
];

function doPost(event) {
  let lock;

  try {
    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const data = JSON.parse(event.postData.contents);

    if (
      !data.fullName ||
      !data.ceremony ||
      (data.ceremony === 'Có' && !data.vluAffiliation) ||
      !data.party ||
      (data.ceremony === 'Có' &&
        data.vluAffiliation === 'Không phải' &&
        (!data.birthYear ||
          !data.email ||
          !GMAIL_PATTERN.test(String(data.email).trim())))
    ) {
      return jsonResponse({
        ok: false,
        message: 'Thiếu thông tin bắt buộc.',
      });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.appendRow(SHEET_HEADERS);
      sheet.setFrozenRows(1);
    }

    ensureSheetLayout(sheet);
    const sequenceNumber = Math.max(sheet.getLastRow(), 1);

    sheet.appendRow([
      sequenceNumber,
      sanitizeCell(data.fullName),
      sanitizeCell(data.ceremony),
      sanitizeCell(data.party),
      sanitizeCell(data.birthYear || ''),
      sanitizeCell(data.email || ''),
      sanitizeCell(data.note || ''),
      new Date(),
    ]);
    sheet
      .getRange(sheet.getLastRow(), SHEET_HEADERS.length)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({
      ok: false,
      message: error.message,
    });
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}

function updateSheetLayout() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Chưa tìm thấy trang tính RSVP.');
  }

  ensureSheetLayout(sheet);
}

function ensureSheetLayout(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const currentHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((header) => String(header).trim());

  if (currentHeaders.join('|') === SHEET_HEADERS.join('|')) {
    return;
  }

  const existingRows =
    lastRow > 1
      ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()
      : [];
  const columnIndex = {};

  currentHeaders.forEach((header, index) => {
    columnIndex[header] = index;
  });

  const valueFrom = (row, header) => {
    const index = columnIndex[header];
    return index === undefined ? '' : row[index];
  };

  const reorderedRows = existingRows.map((row, index) => [
    index + 1,
    valueFrom(row, 'Họ và tên'),
    valueFrom(row, 'Tham dự lễ tốt nghiệp'),
    valueFrom(row, 'Tham dự tiệc ăn mừng'),
    valueFrom(row, 'Năm sinh'),
    valueFrom(row, 'Email'),
    valueFrom(row, 'Nhắn nhủ') || valueFrom(row, 'Ghi chú'),
    valueFrom(row, 'Thời gian gửi'),
  ]);

  sheet.clearContents();
  sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);

  if (reorderedRows.length > 0) {
    sheet
      .getRange(2, 1, reorderedRows.length, SHEET_HEADERS.length)
      .setValues(reorderedRows);
    sheet
      .getRange(2, SHEET_HEADERS.length, reorderedRows.length, 1)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }

  sheet.setFrozenRows(1);
}

function sanitizeCell(value) {
  const text = String(value).trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
