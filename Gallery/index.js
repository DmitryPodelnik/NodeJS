// Сервер на JS
const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML           = WWW_ROOT + "/index.html";
const DEFAULT_MIME         = "application/octet-stream";
const UPLOAD_PATH          = WWW_ROOT + "/pictures/";
const MAX_SESSION_INTERVAL = 100000;  // milliseconds

// Подключение модулей
const http = require("http");         // HTTP
const fs = require("fs");           // file system
const mysql = require("mysql");        // MySQL
const crypto = require("crypto");       // Средство криптографии     (в т.ч. хеш)
const mysql2 = require("mysql2");       // Обновленные средства для MySQL 

const connectionData = {
    host: 'localhost',      // размещение БД (возможно IP или hostname)
    port: 3306,             // порт
    user: 'gallery_user',   // логин пользователя (to 'gallery_user'@'localhost')
    password: 'gallery_pass',   // пароль (identified by 'gallery_pass')
    database: 'gallery',    // schema/db (create database gallery;)
    charset: 'utf8'         // кодировка канала подключения
};

const services = { dbPool: null };
const sessions = {};
global.session = null;

// Session cleaner 
setInterval(() => {
    const moment = new Date();
    let expired = [];
    for (let index in sessions) {
        if (moment - sessions[index].timestamp > MAX_SESSION_INTERVAL) {
            expired.push(index);
        }
    }
    for (let index of expired) {
        if (global.session == sessions[index]) {
            global.session = null;
        }
        delete sessions[index];
    }
}, 1e4)

http.ServerResponse.prototype.send418 = async function () {
    this.statusCode = 418;
    this.setHeader('Content-Type', 'text/plain');
    this.end('teapot');
};

// Серверная функция
function serverFunction(request, response) {
    services.dbPool = mysql2.createPool(connectionData);

    request.services = services;
    global.services = services;

    response.errorHandlers = {
        "send412": message => {
            response.statusCode = 412;
            response.setHeader('Content-Type', 'text/plain');
            response.end("Precondition Failed: " + message);
        },
        "send500": () => {
            response.statusCode = 500;
            response.setHeader('Content-Type', 'text/plain');
            response.end("Error in server");
        },
    };

    response.on("close", () => {
        services.dbPool.end();
    });
    request.params = {
        body: "",
        query: "",
        cookie: {}
    };
    analyze(request, response);
}

function extractCookie(request) {
    let res = {};
    if (typeof request.headers.cookie != 'undefined') {
        /// cookie separated by '; ' 
        const cookies = request.headers.cookie.split('; ');
        // name/value separated by '='
        for (let c of cookies) {
            let pair = c.split('=');
            if (typeof pair[0] != 'undefined'
                && typeof pair[1] != 'undefined') {
                res[pair[0]] = pair[1];
            }
        }
    }
    return res;
}

async function startSession(request) {
    return new Promise(function(resolve, reject) {
        if (typeof request.params.cookie['session-id'] != 'undefined') { // request содержит session id
            const sessionId = request.params.cookie['session-id'];
            if (typeof sessions[sessionId] == 'undefined') {  // start of new session
                // find data about User
                global.services.dbPool.execute(
                    "SELECT * FROM users WHERE id = ?",
                    [sessionId],
                    (err, results) => {
                        if (err) {
                            console.log("startSession" + err);
                            global.session = null;
                        } else {
                            sessions[sessionId] = {
                                "timestamp": new Date(),
                                "user": results[0],
                            };
                            global.session = sessions[sessionId];
                        }
                        resolve(global.session);
                    }
                );
            } else {  // start of new session
                global.session = sessions[sessionId];
                resolve(global.session);
            }
        } else {
            global.session = null;
            resolve(global.session);
        }
    });
}

function extractQueryParams(request) {
    // TODO: replace code to function
}

async function analyze(request, response) {
    // логируем запрос - это must have для всех серверов
    console.log(request.method + " " + request.url);
    // console.log(request.headers.cookie);

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
    request.params.query = params;
    // console.log(request.params.query);
    request.params.cookie = extractCookie(request);
    await startSession(request);
    console.log(request.params.query, request.params.cookie); //, global.session);

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
    request.decodedUrl = url;
    if (url == '') {
        // запрос / - передаем индексный файл
        sendFile(INDEX_HTML, response);
    }
    else if (url == 'db') {
        viewDb(request, response);
    }
    else if (url == 'dbpool') {
        viewDbPool(request, response);
    }
    else if (url == 'db2') {
        viewDb2(request, response);
    }
    else if (url.indexOf("api/") == 0) {  // запрос начинается с api/
        processApi(request, response);
        return;
    }
    else if (url == 'auth') {
        viewAuth(request, response);
    }
    else if (url == 'junk') {
        viewJunk(request, response);
    }
    else if (url == 'download') {
        viewDownload(request, response);
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
    else if (url == 'templates/auth1.tpl') {  // шаблон блока авторизации
        if (!global.session || !global.session.user) {
            sendFile(WWW_ROOT + "/templates/auth.tpl", response);
        } else {
            // sendFile(WWW_ROOT + "/templates/auth_yes.tpl", response);
            fs.readFile(WWW_ROOT + "/templates/auth_yes.tpl", (err, data) => {
                if (err) {
                    console.log("/templates/auth_yes.tpl: " + err);
                    response.errorHandlers.send500();
                }
                response.end(
                    data.toString().replace('{{login}}', global.session.user.login)
                );
            });
        }
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
        // if (typeof statusCode == 'undefined') statusCode = 200 ;        
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
    const apiUrl = request.decodedUrl.substring(4);  // удаляем api/ из начала   
    /*
     if( apiUrl == "picture" ) {
         pictureController.analyze( request, response ) ;
     }*/
    /*
    if( apiUrl == "picture" ) {
        
    }*/
    const moduleName = "./" + apiUrl + "Controller.js";
    if (fs.existsSync(moduleName)) {
        import(moduleName)
            .then(({ default: api }) => {
                api.analyze(request, response);
            })
            .catch(console.log)
    } else {
        send418(response);
    }
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
            // const salt = crypto.createHash('sha1').update("321").digest('hex');
            // const pass = crypto.createHash('sha1').update("321" + salt).digest('hex');
            // response.end("Connection OK " + salt + " " + pass);
            // выполнение запросов
            connection.query("select * from users", (err, results, fields) => {
                if (err) {
                    console.error(err);
                    send500(response);
                } else {
                    console.log(results);
                    console.log("------");
                    console.log(fields);
                    let table = "<table>";
                    table += `
                    <caption>Users table</caption>
                    <tr>
                        <th>id</th>
                        <th>login</th>
                        <th>pass_salt</th>
                        <th>pass_hash</th>
                        <th>email</th>
                        <th>picture</th>
                    </tr>`
                    for (fields of results) {
                        table += "<tr><td>" + fields.id + "</td>"
                        table += "<td>" + fields.login + "</td>"
                        table += "<td>" + fields.pass_salt + "</td>"
                        table += "<td>" + fields.pass_hash + "</td>"
                        table += "<td>" + fields.email + "</td>"
                        table += "<td>" + fields.picture + "</td></tr>"
                    }

                    table += "</table>";

                    response.end(table);
                }
            });
        }

    });
}

function viewDbPool(request, response) {
    const pool = mysql.createPool(connectionData);
    pool.query("select * from users", (err, results, fields) => {
        if (err) {
            console.error(err);
            send500(response);
        } else {
            console.log(results);
            console.log("------");
            console.log(fields);
            let table = "<table border=1 cellspacing=0>";
            table += `
            <caption>Users table POOL</caption>
            <tr>
                <th>id</th>
                <th>login</th>
                <th>pass_salt</th>
                <th>pass_hash</th>
                <th>email</th>
                <th>picture</th>
            </tr>`
            for (fields of results) {
                table += "<tr><td>" + fields.id + "</td>"
                table += "<td>" + fields.login + "</td>"
                table += "<td>" + fields.pass_salt + "</td>"
                table += "<td>" + fields.pass_hash + "</td>"
                table += "<td>" + fields.email + "</td>"
                table += "<td>" + fields.picture + "</td></tr>"
            }

            table += "</table>";

            response.end(table);
        }
    });
}

function viewDb2(request, response) {
    // mysql2 - расширение mysql, поэтому поддерживает те же функции
    // + promise API
    const pool2 = mysql2.createPool(connectionData).promise();
    pool2.query("select * from users")
        .then(([results, fields]) => {
            let table = "<table border=1 cellspacing=0>";
            table += `
                    <caption>Users table POOL</caption>
                    <tr>
                        <th>id</th>
                        <th>login</th>
                        <th>pass_salt</th>
                        <th>pass_hash</th>
                        <th>email</th>
                        <th>picture</th>
                    </tr>`
            for (fields of results) {
                table += "<tr><td>" + fields.id + "</td>"
                table += "<td>" + fields.login + "</td>"
                table += "<td>" + fields.pass_salt + "</td>"
                table += "<td>" + fields.pass_hash + "</td>"
                table += "<td>" + fields.email + "</td>"
                table += "<td>" + fields.picture + "</td></tr>"
            }

            table += "</table>";

            response.end(table);
        })
        .catch(err => {
            console.error(err);
            send500(response);
        });
}

function viewAuth(request, response) {
    const pool2 = mysql2.createPool(connectionData).promise();

    const salt = crypto.createHash('sha1').update(request.params.query.password).digest('hex');
    const pass = crypto.createHash('sha1').update(request.params.query.password + salt).digest('hex');
    const user = [request.params.query.login, pass];
    pool2.execute(`SELECT * FROM users 
                   WHERE EXISTS 
                    (SELECT * 
                     FROM users 
                     WHERE login = ? AND pass_hash = ?)`, user)
        .then(([rows, fields]) => {
            if (rows.length > 0) {
                console.log("Authorize successful");
                response.end("Authorize successful");
            } else {
                console.log("Incorrect login or password");
                response.end("Incorrect login or password");
            }
        })
        .catch(err => {
            console.error(err);
            send500(response);
        });

    //response.end(request.params.query.login + " " + request.params.query.password);
}

function viewJunk(request, response) {
    sendFile(WWW_ROOT + "/junk.html", response)
}

function viewDownload(request, response) {
    global.services.dbPool.execute(
        "SELECT filename FROM pictures WHERE id = ?",
        [request.params.query.picId],
        (err, results) => {
            if (err) {
                console.log(err);
                response.errorHandlers.send500();
            } else {
                response.setHeader('Content-Type', 'application/octet-stream');
                response.setHeader('Content-Disposition', 'attachment; ' + `filename="${results[0].filename}"`);
                // TODO: set name for file
                fs.createReadStream(UPLOAD_PATH + results[0].filename)
                    .pipe(response);
            }
        }
    );
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
        3. Работа с крипто-хешем: модуль crypto
        4. connection.query("SQL", (err, results, fields) => {})
        5. Пул подключений.
            Подключение к БД - системный ресурс (неуправляемый), требующий закрытия.
            ? Сайт обычно работаем с одной БД и все обращения (запросы) подключаются к ней.
              Если есть возможность повторного использования подключения - это хорошо.
            ? Если с каждым запросом открывать новое подключение и не закрывать его,
              то возможны сбои СУБД.
            Современное решение - пул подключений
            const pool = mysql.createPool(connectionData);
            далее, к pool обращение такое же, как к connection, например:
                pool.query("SQL", (err, results, fields) => {})
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
        ('admin', '40bd001563085fc35165329ea1ff5c5ecbdbbeef', '5e558e07a57a3df06e8870d690c4a22f21c76e61', 'admin@gallery.step');

        // Задание: подготовить данные (стр. 399) для 'user' с паролем '321'
        INSERT INTO users(login, pass_salt, pass_hash, email) VALUES
        ('user', '5f6955d227a320c7f1f6c7da2a6d96a851a8118f', '975b234495c549a37884458b12df0c495b7afc5c', 'user@gallery.step');
*/

/*
        Задание: сделать страницу авторизации -
        поля ввода логина/пароля + кнопка "вход"
        после нажатия : a) добро пожаловать; б) посторонним вход воспрещен
*/

/*
    Структура таблицы для галереи (картин галереии)
    CREATE TABLE pictures (
        id          BIGINT DEFAULT UUID_SHORT() PRIMARY KEY,
        title       VARCHAR(128) NOT NULL,
        description TEXT,
        place VARCHAR(256),
        filename    VARCHAR(256) NOT NULL,
        users_id    BIGINT,                                 -- uploader ID
        uploadDT    DATETIME DEFAULT CURRENT_TIMESTAMP,     -- upload Date/time
        deleteDT    DATETIME,                                -- delete date/time
    ) ENGINE=InnoDB DEFAULT CHARSET=UTF8;
 */

/*
    Модули: подключение кода из другого файла.
        В языках-интерпретаторах текст является исполнимым, поэтому
        есть термин "передать управление в файл" или "выполнить файл" (например, в PHP).
        file
        cmd
        cmd
        include(file2)  --> file2
                                cmd
                                cmd
                                cmd
        cmd                     <--
        cmd
    В JS файл обычно считается самостоятельной единицей - модулем.
    Модуль локализует область видимости - все, что объявлено в файле,
    остается видимым только в этом файле. Аналогом модификатора public
    в модулях является свойство exports (module.exports), через которое
    объекты становятся доступными в точке подключения модуля.
        Подключение модуля (импорт) может быть статическим и динамическим.
    Статический импорт - изначально сканирует директории на наличие
    файла-модуля и не запустит программу, если файл не найден. Имя модуля
    должно быть константой (иногда даже не допускаются ё-кавычки).
        Динамический имопрт - считается экспериментальным (выдает предупреждения),
    но позволяет определить имя модуля "на лету" и добавить функциональность
    в зависимости от необходимости.

    Пример - контроллеры (userCtr, pictureCtr)
    a) статика - подключаем оба модуля, по тексту запроса определяем какой из них
       вызвать.
    б) динамика - по тексту запроса определяем имя файла контроллера, пробуем
       подключить модуль.

    -- y = x; - читать x, передать значение в y
        на этапе компиляции ошибки нет. => компилятор использует только синтаксический
        анализатор.
        На этапе выполнения x не определена, возникает ошибка.

        "+" интерпретатора: возможность работы по имени - проверить есть ли класс,
            метод, переменная и т.п.
            PHP - classExists(name) / Object.hasOwnProperty(...)
                  exists(name)        typeof name == 'undefined'?

                  Статика                                                Динамика
    + один раз подключается, потом используется             подключается каждый раз при выполнении кода
                                                            допускает горячее подключение и замену

    - требует переписывания кода при добавлении модуля      не требует


    ?                        подключить динамически, но один раз при старте
                        + не нужно переписывать код        - требуется перезапуск
*/
/*
    Позднее свяывание и this
    Позднее связывание - значение переменной определяется во время выполнения операции.
    for (i) { new Button(click -> log(i)) }
    ожидается - 10 кнопок, каждая выводит свой номер
    реальность - все кнопки выводят 11 (значение i после цикла)
                 this - объект, в котором <s>находится</s> вызывается click
                        - Subject - уведомитель механизма событий - объекты
                          самой системы браузера, выше чем BOM (window)
                          this = undefined
*/

    // определение данных из тела запроса (POST-данных)
/* Если запрос большой, то тело может передаваться частями (chunk-ами).
   Для работы с телом, его необходимо сначала получить (собрать), затем обрабатывать.
   Приход chunk-а сопровождается событием "data", конец пакета - событие "end" */
/*
requestBody = [];  // массив chunk-ов
request.on("data", chunk => requestBody.push(chunk))
 .on("end", () => {  // конец получения пакета (запроса)
     request.params = {
         body: Buffer.concat(requestBody).toString()
     };
     analyze(request, response);
 });
 */