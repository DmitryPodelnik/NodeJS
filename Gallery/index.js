// Сервер на JS
const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML = WWW_ROOT + "/index.html";
const DEFAULT_MIME = "application/octet-stream";
const UPLOAD_PATH  = WWW_ROOT + "/pictures/";

// Подключение модулей
const http       = require("http");         // HTTP
const fs         = require("fs");           // file system
const formidable = require("formidable");   // Form parser
const mysql      = require("mysql");        // MySQL
const crypto     = require("crypto");       // средство криптографии     (в т.ч. хеш)

const connectionData = {
    host:       'localhost',      // размещение БД (возможно IP или hostname)
    port:       3306,             // порт
    user:       'gallery_user',   // логин пользователя (to 'gallery_user'@'localhost')
    password:   'gallery_pass',   // пароль (identified by 'gallery_pass')
    database:   'gallery',    // schema/db (create database gallery;)
    charset:    'utf8'         // кодировка канала подключения
};

// Серверная функция
function serverFunction(request, response) {
    // определение данных из тела запроса (POST-данных)
    /* Если запрос большой, то тело может передаваться частями (chunk-ами).
       Для работы с телом, его необходимо сначала получить (собрать), затем обрабатывать.
       Приход chunk-а сопровождается событием "data", конец пакета - событие "end" */
    // requestBody = [];  // массив chunk-ов
    // request.on("data", chunk => requestBody.push(chunk))
    //     .on("end", () => {  // конец получения пакета (запроса)
    //         request.params = {
    //             body: Buffer.concat(requestBody).toString()
    //         };
    //         analyze(request, response);
    //     });
    request.params = {
        body: ""
    };
    analyze(request, response);
}

function analyze(request, response) {
    // логируем запрос - это must have для всех серверов
    console.log(request.method + " " + request.url);
    // Декодируем запрос: "+" -> пробел, затем decodeURI
    var decodedUrl = request.url.replace(/\+/g, ' ');
    decodedUrl = decodeURIComponent(decodedUrl);
    // разделяем запрос по "?" - отделяем параметры
    const requestParts = decodedUrl.split("?");
    // первая часть (до ?) - сам запрос
    const requestUrl = requestParts[0];
    // вторая часть - параметры по схеме key1=val1 & key2=val2
    var params = {};
    if (requestParts.length > 1         // есть вторая часть
        && requestParts[1].length > 0) {  // и она не пустая
        for (let keyval of requestParts[1].split("&")) {
            let pair = keyval.split("=");
            params[pair[0]] =
                typeof pair[1] == 'undefined'
                    ? null
                    : pair[1];
        }
    }
    console.log(params);

    // проверить запрос на спецсимволы (../)
    const restrictedParts = ["../", ";"];
    for (let part of restrictedParts) {
        if (requestUrl.indexOf(part) !== -1) {
            send418(response);
            return;
        }
    }

    // проверяем, является ли запрос файлом
    const path = WWW_ROOT + requestUrl;
    if (fs.existsSync(path)   // да, такой объект существует
        && fs.lstatSync(path).isFile()) {  // и это файл        
        sendFile(path, response);
        return;
    }
    // нет, это не файл. Маршрутизируем
    const url = requestUrl.substring(1);
    if (url == '') {
        // запрос / - передаем индексный файл
        sendFile(INDEX_HTML, response);
    }
    else if (url == 'db') {
        viewDb(request, response);
    }
    else if (url.indexOf("api/") == 0) {  // запрос начинается с api/
        request.params.query = params;
        processApi(request, response);
        return;
    }
    else if (url === 'hello') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end("<h1>Hello, world</h1>"); // ~getWriter().print in java 
    } 
    else if (url === 'js') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end("<h1>Node is cool</h1>"); // ~getWriter().print in java
    }
    else {
        // необработанный запрос - "не найдено" (404.html)
        sendFile(FILE_404, response, 404);
    }
}

// Создание сервера (объект)
const server = http.createServer(serverFunction);

// Запуск сервера - начало прослушивания порта
server.listen(  // регистрируемся в ОС на получение 
    // пакетов, адрессованных на наш порт 
    HTTP_PORT,  // номер порта
    () => {  // callback, после-обработчик, вызывается
        // после того, как "включится слушание"
        console.log("Listen start, port " + HTTP_PORT);
    }
);

// задание
async function sendFile2(path, response, statusCode) {
    fs.readFile(
        path,
        (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            if (typeof statusCode == 'undefined') {
                statusCode = 200;
            }
            response.statusCode = statusCode;
            response.setHeader('Content-Type', 'text/html; charset=utf-8');
            response.end(data);
        });
}

// Stream - piping: stream copy from readable stream to writable
async function sendFile(path, response, statusCode = 200) {
    var readStream = false;
    if (fs.existsSync(path)) {
        readStream = fs.createReadStream(path);
        //if( typeof statusCode == 'undefined' ) statusCode = 200 ;        
    } else if (fs.existsSync(FILE_404)) {
        readStream = fs.createReadStream(FILE_404);
        statusCode = 404;
    }

    if (readStream) {
        response.statusCode = statusCode;
        response.setHeader('Content-Type', getMimeType(path));
        readStream.pipe(response);
    } else {
        send418(response);
    }

    // задание: проверить наличие файла перед отправкой:
    // 1. ищем файл, если есть - отправляем
    // 2. если нет - ищем 404, отправляем (если есть)
    // 3. если нет - отправляем строку с 418 кодом
}

// returns Content-Type header value by parsing file name (path)
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
        case 'html':
        case 'css':
            return 'text/' + extension;
        case 'jpeg':
        case 'jpg':
            return 'image/jpeg';
        case 'bmp':
        case 'gif':
        case 'png':
            return 'image/' + extension;
        case 'json':
        case 'pdf':
        case 'rtf':
            return 'application/' + extension;
        default:
            return DEFAULT_MIME;
    }
}

// Обратка запросов   api/*
async function processApi(request, response) {
    var res = { status: "" };
    // принять данные формы
    // ! отключить (если есть) наш обработчик событий data/end
    const formParser = formidable.IncomingForm();
    formParser.parse(request, (err, fields, files) => {
        if (err) {
            console.error(err);
            send500(response);
            return;
        }
        let validateRes = validatePictureForm(fields, files);
        if (validateRes === true) {
            // OK
            const savedName = moveUploadedFile(files.picture)
            if (savedName !== "uploadError") {     
               res.params.savedPictureUrl = "/pictures/" + savedName;  
            } else {
                console.log("Image uploading error!");
                return;
            }
            res.status = "Works"; 
        } else {
            // Validation error,validateRes - message
            send412(validateRes, response);
            return;
        }

        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(res));
    });
    // return;
    res.status = "Works";
    // упражнение: включить в ответ все принятые параметры запроса
    res.params = request.params;
}

function moveUploadedFile(file) {
    var counter = 1;
    var savedName;
    do {
        savedName = `(${counter++})_${file.name}`;
    } while(fs.existsSync(UPLOAD_PATH + savedName));

    // rename - если на одном и том же диске находится,
    // или использовать copyFile
    fs.copyFile(file.path, UPLOAD_PATH + savedName, err => {
        if (err) {
            console.log(err);
            savedName = "uploadError";
        }
    });
    return savedName;
}

function validatePictureForm(fields, files) {
    // задание: проверить поля на наличие и допустимость

    if (typeof fields["description"] == 'undefined') {
        return "Description required";
    }

    if (fields["description"].length == 0) {
        return "Description should be non-empty";
    }

    // place optional. But if present then should be non-empty
    if (typeof files["place"] != 'undefined'
        && fields["place"].length == 0) {
        return "Place should be non-empty";
    }

    if (typeof files["picture"] == 'undefined') {
       return "File required";
    }

    return true;
} 

async function send412(message, response) {
    response.statusCode = 412;
    response.setHeader('Content-Type', 'text/plain');
    response.end("Precondition Failed: " + message);
}

async function send418(response) {
    // TODO: создать страницу "Опасный запрос"
    response.statusCode = 418;
    response.setHeader('Content-Type', 'text/plain');
    response.end("I'm a teapot");
}

async function send500(response) {
    response.statusCode = 500;
    response.setHeader('Content-Type', 'text/plain');
    response.end("Error in server");
}

// Работа с БД
function viewDb(request, response) {
    // создаем подключение
    const connection = mysql.createConnection(connectionData);
    connection.connect(err => {
        if (err) {
            console.error(err);
            send500(response);
        } else {
            // const salt = crypto.createHash('sha1').digest('hex');
            // const pass = crypto.createHash('sha1').update("123" + salt).digest('hex');
            // response.end("Connection OK" + salt + " " + pass);
            // выполнение запросов
            connection.query("select * from users", (err, results, fields) => {
                if (err) {
                    console.error(err);
                    send500(response);
                } else {
                    console.log(results);
                    console.log("------");
                    console.log(fields);
                    response.end("Query OK");
                }
            });
        }
        
    });
}


/* 
    npm Node Pack Manager
    1. Инициализация папки - создание файла package.json
       npm init 
       npm init -y
    
    2. Установка пакетов
       npm install <pack-name>
       npm i <pack-name>

    3. Команда(ы) запуска 
       "scripts": {
            "start": "node index.js",  // npm start
            "mystart": "node index.js",  // npm run start
            "test": "echo \"Error: no test specified\" && exit 1"
        }

    formidable - пакет для приема данных формы (в т.ч. файлов)
    npm i formidable
*/

/* 
    Работа с БД MySQL.
    0. Настройка БД (в MySQL)
        // запускаем терминал СУБД / граф.интерфейс, подаём команды
        create database gallery;
        grant all privileges on gallery.* to 'gallery_user'@'localhost' identified by 'gallery_pass';
    1. Установка пакетов
        npm i mysql
        // или
        npm i mysql2
    2. Параметры и подключение
        2.1. const connectionData = {
            host:       'localhost',      // размещение БД (возможно IP или hostname)
            port:       3306,             // порт
            user:       'gallery_user',   // логин пользователя (to 'gallery_user'@'localhost')
            password:   'gallery_pass',   // пароль (identified by 'gallery_pass')
            database:   'gallery',    // schema/db (create database gallery;)
            charset:    'utf8'         // кодировка канала подключения
        };
        2.2 const connection = mysql.createConnection(connectionData);
        2.3.     // создаем подключение
            const connection = mysql.createConnection(connectionData);
            connection.connect(err => {
                if (err) {
                    console.error(err);
                    send500(response);
                } else {
                    response.end("Connection OK");
                }
        
            });
        3.
*/
/* 
        Упражнение "Авторизация"
        1. Создание таблицы
        CREATE TABLE users (
            id         BIGINT       DEFAULT UUID_SHORT() PRIMARY KEY,
            login      VARCHAR(64)  NOT NULL,
            pass_salt  VARCHAR(40)  NOT NULL,
            pass_hash  VARCHAR(40)  NOT NULL,
            email      VARCHAR(64)  NOT NULL,
            picture    VARCHAR(256)
        ) ENGINE = InnoDB, DEFAULT CHARSET = UTF8;

        2. Тестовые записи (пароль 123)
        INSERT INTO users(login, pass_salt, pass_hash, email) VALUES 
        ('admin', 'OKda39a3ee5e6b4b0d3255bfef95601890afd80709', '3c87fc51c024c4dbe8e123f492e1cbe7b4a21f35', 'admin@gallery.step');

*/