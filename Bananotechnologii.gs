function doPost(e) {
  const request_body = JSON.parse(text=e["postData"]["contents"]);
  const table_line = [
    Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss"),
    request_body["Название команды"],
    request_body["Фамилия"],
    request_body["Имя"],
    request_body["Отчество"],
    request_body["Фамилия (латиницей)"],
    request_body["Имя (латиницей)"],
    request_body["Отчество (латиницей)"],
    request_body["Есть ли у игрока гражданство РФ?"],
    "'" + request_body["Контактный номер игрока"],  // для корректного отображения + в таблице
    request_body["Контактная почта игрока"],
    ];
  uploadNewResponse(table_line);
  return ContentService.createTextOutput(JSON.stringify(table_line)).setMimeType(ContentService.MimeType.JSON);
}


function uploadNewResponse(row_data) {
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const answer_sheet = spreadsheet.getSheetByName("Ответы из формы");
  // const test_row_data = ['25.11.2024 23:59:59', 'Тестовая команда', 'Фамилия', 'Имя', 'Отчество',
  // 'Familiia', 'Imia', 'Otchestvo', 'Да', '+79323459645', 'orgkom@aicteam.ru'];

  const last_filled_row = answer_sheet.getLastRow();
  answer_sheet.insertRowAfter(last_filled_row);
  answer_sheet.appendRow(row_data);
}