// Сервер на JS
const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML = WWW_ROOT + "/index.html";
const DEFAULT_MIME = "application/octet-stream";

// Подключение модуля
const http = require('http');
const fs = require('fs');  // file system

// Серверная функция
function serverFunction(request, response) {
    // логируем запрос - это must have для всех серверов

    // разделяем запрос по "?" - отделяем параметры
    const requestParts = request.url.split('?');
    // первая часть (до ?) - сам запрос
    const requestUrl = requestParts[0];
    // вторая часть - параметры по схеме key1=val1&key2=val2
    var params = {};
    if (requestParts.length > 1  // есть вторая часть
        && requestParts[1].length > 0) {  // и она не пустая
        for (let keyval of requestParts[1].split('=')) {
            let pair = keyval.split('=');
            params[pair[0]] = typeof pair[1] == 'undefined' 
            ? null
            : pair[1];
        }
    }
    console.log(params);

    console.log(request.method + " " + request.url);
    // проверить запрос на спецсимволы (../)
    const restricted = ["../", ";"];
    for (let part of restricted) {
        if (requestUrl.indexOf(part) !== -1) {
            // TODO: создать страницу "Опасный запрос"
            response.statusCode = 418;
            response.setHeader('Content-Type', 'text/plain');
            response.end('I am a teapot');
            return;
        }
    }
    // проверяем, является ли запрос файлом
    const path = WWW_ROOT + requestUrl;
    if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {  // да, такой файл существует

        const extension = getMimeType(request.url);
        sendFile(path, response, extension);
        return;
    }
    // нет, это не файл. Маршрутизируем
    const url = requestUrl.substring(1)
    if (url === '') {
        // запрос / - передаем индексный файл
        sendFile(INDEX_HTML, response);
       // response.end("<meta charset='utf-8'/><h1>Home, sweet Home привет</h1>"); // ~getWriter().print
    }
    else if (url.indexOf("api/") == 0) { // запрос начинается с api/
        request.params = params;
        processApi(request, response);
        return;
    } 
    else if (url === 'js') {

    }
    else {
        // необработанный запрос - "не найдено" (404.html)
        sendFile(FILE_404, response, 404);
    }

}

// Создание сервера (объект)
const server = http.createServer(serverFunction);

// Запуск сервера - начало прослушивания
server.listen(  // регистрируемся в ОС на получение пакетов, 
                // адресованных на наш порт
    HTTP_PORT,  // номер порта
    () => {  // callback, после-обработчик, вызывается после того, как 
             // будут выполнены действия ("включится слушание")
        console.log("Listen started, port " + HTTP_PORT); 
    }
);

/// задание
async function sendFile2(path, response, extension, statusCode) {
    fs.readFile(
        path,  // путь к файлу
        // callback - выполнится после открытия файла
        // sendFile// открытие файла на чтение - асинхронно - отложенно
        (err, data) => {
            if (err) {
                console.error(err);
                return;
            } 
            if (typeof statusCode == 'undefined') {
                statusCode = 200;
            } else {
                response.statusCode = 404;
            }
            response.statusCode = statusCode;
            response.setHeader('Content-Type', getMimeType(path));
            response.end(data);
        }
    );
}

async function sendFile(path, response, extension, statusCode = 200) {
        // Stream - piping: stream copy from readable stream to writable
    var readStream = false;
    if (fs.existsSync(path)) {
        readStream = fs.createReadStream(path);
    } else if (fs.existsSync(FILE_404)) {
        readStream = fs.createReadStream(FILE_404);
        statusCode = 404;
    }

    if (readStream) {
        response.statusCode = statusCode;
        response.setHeader('Content-Type', getMimeType(path));
        readStream.pipe(response);
    } else {
        response.statusCode = 418;
        response.setHeader('Content-Type', 'text/plain');
        response.end('I am a teapot');
    }

    response.statusCode = statusCode;
    if (typeof statusCode == 'undefined') {
        statusCode = 200;
    }


    // задание: проверить наличие файла перед отправкой:
    // 1. ищем файл, если есть - отправляем
    // 2. если нет - ищем 404, отправляем (если есть)
    // 3. если нет - отправляем строку 418 кодом
}

function getMimeType(path) {
    // file extension
    if (!path) {
        return false;
    }
    const dotPosition = path.lastIndexOf('.');
    if (dotPosition == -1) {  // no extension
        return DEFAULT_MIME;
    }
    const extension = path.substring(dotPosition + 1);
    switch (extension) {
        case 'html' :
        case 'css'  :
            return 'text/' + extension;
        case 'jpeg' :
        case 'jpg'  :
            return 'image/jpeg';
        case 'bmp'  :
        case 'gif'  :
        case 'png'  :
            return 'image/' + extension;
        case 'json' :
        case 'pdf'  :
        case 'rtf'  :    
            return 'application/' + extension;

        default :
            return DEFAULT_MIME;
    }
}

// обработка запросов api/*
async function processApi(request, response) {
    var res = {};

    res.status = "Works";
    // упражнение: включить в ответ все принятые параметры запроса
    res.params = request.params;

    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(res));
}
