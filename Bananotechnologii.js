Logger = BetterLog.useSpreadsheet('1R4ORVal0Ms3Ixzaxpb0Jsz6EPa45-Pph6SKlGphCTu8');
Logger.setLevel("FINER");  // разобратьcя, как настроить уровень через свойства скрипта

const markKeys = {0: "i", 1: "d", 2: "y", 3: "b", 4: "s", 5: "o", 6: "m", 7: "e", 8: "z", 9: "k"};
const markRandLen = 2;
const answerSheetName = "Ответы из формы";
const fields = [
  ["Название команды"],
  ["Игровой зачёт"],
  ["Зачёт Студенческого чемпионата России"],
  ["ID команды на Турнирном сайте"],
  ["Представитель команды (Фамилия, Имя)"],
  ["Контакты представителя (tg / vk)"],
  ["Есть ли в команде игроки, которым необходим пропуск в НИУ ВШЭ?"],
  ["Я проконтролирую, чтобы на всех игроков моей команды без пропуска в ВШЭ была заполнена форма выше"],
  ["Поле для комментариев, идей и предложений"],
];



function doPost(e) {

  function removeSpaces(entered) {
    if (typeof entered !== "string") {
      return entered;
    }
    let output = entered.trim();  // удаление пробельных символов с концов строки
    output = output.replace(/\s*[\n\r\f]\s*/g, "\n"); // замена всех сочетаний пробельных символов, включающих перевод строки, на одиночный перевод
    output = output.replace(/\s\s+/g, " "); // замена всех сохранившихся сочетаний 2+ пробельных символов на одиночный пробел
    return output;
  }


  function screen(entered) {
    if (typeof entered !== "string") {
      return entered;
    }
    if (entered.charAt(0) == "+" || entered.charAt(0) == "=") {
      return "'" + entered;
    } else {
      return entered;
    }
  }


  function parsePhone(entered) {  // введённый номер телефона приводится к формату +79323459645 из других стандартных форматов
    if (typeof entered !== "string") {
      return entered;
    }
    let output = entered.replace(/[\s()-]/g, "");  // удаление всех пробелов, скобок и дефисов
    if (output.charAt(0) == "8") {  // замена (однократная) начального 8 на начальное +7
      output = output.replace("8", "+7");
    }
    return output;
  }


  function parseDate(entered) {  // введённая дата из строки формата ISO переводится в дату JS и записывается в привычном виде
    if (typeof entered !== "string") {
      return entered;
    }
    return Utilities.formatDate(new Date(entered), "GMT+3", "dd.MM.yyyy");
  }


  function parseValue(entered, specParser, preParser = removeSpaces, postParser = screen) {
    if (typeof entered === 'undefined') {
      return "";
    }
    let output = preParser(entered);
    if (typeof specParser !== 'undefined') {
      output = specParser(output);
    }
    output = postParser(output);
    return output;
  }


  function createRequestMark() {
    let dt = new Date().valueOf().toString();
    for (let digit in markKeys) {
      dt = dt.replaceAll(digit, markKeys[digit]);
    }
    const rand = (Math.floor(Math.random() * (10 ** markRandLen))).toString().padStart(markRandLen, "0");
    rm = dt + "-" + rand;
    return [rm, `requestMark ${rm}\n`]
  }


  function uploadNewResponse(row_data) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const answer_sheet = spreadsheet.getSheetByName(answerSheetName);
    // const test_row_data = ['25.11.2024 23:59:59', 'Тестовая команда', 'Студенческая команда, Школьная команда', 'Да',
    // '989898', 'Фамилия Имя', 't.me/hse_aic', 'Да', 'Да', 'Тестовый привет'];

    const last_filled_row = answer_sheet.getLastRow();
    answer_sheet.insertRowAfter(last_filled_row);
    answer_sheet.appendRow(row_data);
  }


  const parserKeys = {"no": entered => entered, "Phone": parsePhone, "Date": parseDate};

  const [requestMark, logCap] = createRequestMark();
  Logger.finer(logCap + "new POST request! Start");
  try {
  const request_body = JSON.parse(text=e["postData"]["contents"]);
  Logger.info(logCap + "Form: %s (%s)\nNew answer: %s\nTeam: %s",
  request_body["formName"], request_body.formID, request_body.responseLink, request_body.responseMain);
  const table_line = [new Date()];
  for (let [fieldName, specParserKey, preParserKey, postParserKey] of fields) {
    table_line.push(parseValue(request_body.answers[fieldName], parserKeys[specParserKey], 
    parserKeys[preParserKey], parserKeys[postParserKey]));
  }
  const lock = LockService.getDocumentLock();
  const lock_success = lock.tryLock(180000);  // 3 минуты
  if (!lock_success) {
    Logger.severe(logCap + "Request data were not recorded due to timeout.\nData in JSON: %s\nData for copying: %s",
    JSON.stringify(table_line), table_line.join(";"));
  } else {
  uploadNewResponse(table_line);
  Logger.info(logCap + "New record in the table: %s", JSON.stringify(table_line));
  }
  lock.releaseLock()
  } catch (err) { //with stack tracing if your exceptions bubble up to here
    err = (typeof err === 'string') ? new Error(err) : err;
    Logger.severe(logCap + '%s: %s.\n Stack: "%s"',
              err.name||'', err.message||'', err.stack||'');
    throw err;
  }
  Logger.finer(logCap + "Processing of POST request finished");
}
