"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Сервер на JS
var HTTP_PORT = 80;
var WWW_ROOT = "www";
var FILE_404 = WWW_ROOT + "/404.html";
var INDEX_HTML = WWW_ROOT + "/index.html";
var DEFAULT_MIME = "application/octet-stream";
var UPLOAD_PATH = WWW_ROOT + "/pictures/"; // Подключение модулей

var http = require("http"); // HTTP


var fs = require("fs"); // file system


var formidable = require("formidable"); // Form parser


var mysql = require("mysql"); // MySQL


var crypto = require("crypto"); // Средство криптографии     (в т.ч. хеш)


var mysql2 = require("mysql2"); // Обновленные средства для MySQL 


var pictureController = require("./pictureController");

var userController = require("./userController");

var connectionData = {
  host: 'localhost',
  // размещение БД (возможно IP или hostname)
  port: 3306,
  // порт
  user: 'gallery_user',
  // логин пользователя (to 'gallery_user'@'localhost')
  password: 'gallery_pass',
  // пароль (identified by 'gallery_pass')
  database: 'gallery',
  // schema/db (create database gallery;)
  charset: 'utf8' // кодировка канала подключения

};
var services = {
  dbPool: null
};

http.ServerResponse.prototype.send418 = function _callee() {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          this.statusCode = 418;
          this.setHeader('Content-Type', 'text/plain');
          this.end('teapot');

        case 3:
        case "end":
          return _context.stop();
      }
    }
  }, null, this);
}; // Серверная функция


function serverFunction(request, response) {
  services.dbPool = mysql2.createPool(connectionData);
  request.services = services;
  global.services = services;
  response.errorHandlers = {
    "send412": function send412(message) {
      response.statusCode = 412;
      response.setHeader('Content-Type', 'text/plain');
      response.end("Precondition Failed: " + message);
    },
    "send500": function send500() {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'text/plain');
      response.end("Error in server");
    }
  };
  response.on("close", function () {
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
  var res = {};

  if (typeof request.headers.cookie != 'undefined') {
    /// cookie separated by '; ' 
    var cookies = request.headers.cookie.split('; '); // name/value separated by '='

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = cookies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var c = _step.value;
        var pair = c.split('=');

        if (typeof pair[0] != 'undefined' && typeof pair[1] != 'undefined') {
          res[pair[0]] = pair[1];
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return res;
}

function extractQueryParams(request) {// TODO: replace code to function
}

function analyze(request, response) {
  // логируем запрос - это must have для всех серверов
  console.log(request.method + " " + request.url); // console.log(request.headers.cookie);
  // Декодируем запрос: "+" -> пробел, затем decodeURI

  var decodedUrl = request.url.replace(/\+/g, ' ');
  decodedUrl = decodeURIComponent(decodedUrl); // разделяем запрос по "?" - отделяем параметры

  var requestParts = decodedUrl.split("?"); // первая часть (до ?) - сам запрос

  var requestUrl = requestParts[0]; // вторая часть - параметры по схеме key1=val1 & key2=val2

  var params = {};

  if (requestParts.length > 1 // есть вторая часть
  && requestParts[1].length > 0) {
    // и она не пустая
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = requestParts[1].split("&")[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var keyval = _step2.value;
        var pair = keyval.split("=");
        params[pair[0]] = typeof pair[1] == 'undefined' ? null : pair[1];
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
          _iterator2["return"]();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  request.params.query = params;
  console.log(request.params.query);
  request.params.cookie = extractCookie(request);
  console.log(request.params.cookie); // проверить запрос на спецсимволы (../)

  var restrictedParts = ["../", ";"];

  for (var _i = 0, _restrictedParts = restrictedParts; _i < _restrictedParts.length; _i++) {
    var part = _restrictedParts[_i];

    if (requestUrl.indexOf(part) !== -1) {
      send418(response);
      return;
    }
  } // проверяем, является ли запрос файлом


  var path = WWW_ROOT + requestUrl;

  if (fs.existsSync(path) // да, такой объект существует
  && fs.lstatSync(path).isFile()) {
    // и это файл        
    sendFile(path, response);
    return;
  } // нет, это не файл. Маршрутизируем


  var url = requestUrl.substring(1);
  request.decodedUrl = url;

  if (url == '') {
    // запрос / - передаем индексный файл
    sendFile(INDEX_HTML, response);
  } else if (url == 'db') {
    viewDb(request, response);
  } else if (url == 'dbpool') {
    viewDbPool(request, response);
  } else if (url == 'db2') {
    viewDb2(request, response);
  } else if (url.indexOf("api/") == 0) {
    // запрос начинается с api/
    processApi(request, response);
    return;
  } else if (url == 'auth') {
    viewAuth(request, response);
  } else if (url == 'junk') {
    viewJunk(request, response);
  } else if (url == 'download') {
    viewDownload(request, response);
  } else if (url === 'hello') {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end("<h1>Hello, world</h1>"); // ~getWriter().print in java 
  } else if (url === 'js') {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end("<h1>Node is cool</h1>"); // ~getWriter().print in java
  } else if (url == 'templates/auth.tpl') {
    // шаблон блока авторизации
    if (typeof request.params.cookie['user-id'] == 'undefined') {
      sendFile(WWW_ROOT + "templates/auth.tpl", response);
    } else {
      sendFile(WWW_ROOT + "templates/auth_yes.tpl", response);
    }
  } else {
    // необработанный запрос - "не найдено" (404.html)
    sendFile(FILE_404, response, 404);
  }
} // Создание сервера (объект)


var server = http.createServer(serverFunction); // Запуск сервера - начало прослушивания порта

server.listen( // регистрируемся в ОС на получение 
// пакетов, адрессованных на наш порт 
HTTP_PORT, // номер порта
function () {
  // callback, после-обработчик, вызывается
  // после того, как "включится слушание"
  console.log("Listen start, port " + HTTP_PORT);
}); // задание

function sendFile2(path, response, statusCode) {
  return regeneratorRuntime.async(function sendFile2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          fs.readFile(path, function (err, data) {
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

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
} // Stream - piping: stream copy from readable stream to writable


function sendFile(path, response) {
  var statusCode,
      readStream,
      _args3 = arguments;
  return regeneratorRuntime.async(function sendFile$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          statusCode = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : 200;
          readStream = false;

          if (fs.existsSync(path)) {
            readStream = fs.createReadStream(path); //if( typeof statusCode == 'undefined' ) statusCode = 200 ;        
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
          } // задание: проверить наличие файла перед отправкой:
          // 1. ищем файл, если есть - отправляем
          // 2. если нет - ищем 404, отправляем (если есть)
          // 3. если нет - отправляем строку с 418 кодом


        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
} // returns Content-Type header value by parsing file name (path)


function getMimeType(path) {
  // file extension
  if (!path) {
    return false;
  }

  var dotPosition = path.lastIndexOf('.');

  if (dotPosition == -1) {
    // no extension
    return DEFAULT_MIME;
  }

  var extension = path.substring(dotPosition + 1);

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
} // Обратка запросов   api/*


function processApi(request, response) {
  var apiUrl, moduleName;
  return regeneratorRuntime.async(function processApi$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          apiUrl = request.decodedUrl.substring(4); // удаляем api/ из начала   

          /*
           if( apiUrl == "picture" ) {
               pictureController.analyze( request, response ) ;
           }*/

          /*
          if( apiUrl == "picture" ) {
              
          }*/

          moduleName = "./" + apiUrl + "Controller.js";

          if (fs.existsSync(moduleName)) {
            Promise.resolve().then(function () {
              return _interopRequireWildcard(require("".concat(moduleName)));
            }).then(function (_ref) {
              var api = _ref["default"];
              api.analyze(request, response);
            })["catch"](console.log);
          } else {
            send418(response);
          }

        case 3:
        case "end":
          return _context4.stop();
      }
    }
  });
}

function send418(response) {
  return regeneratorRuntime.async(function send418$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          // TODO: создать страницу "Опасный запрос"
          response.statusCode = 418;
          response.setHeader('Content-Type', 'text/plain');
          response.end("I'm a teapot");

        case 3:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function send500(response) {
  return regeneratorRuntime.async(function send500$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          response.statusCode = 500;
          response.setHeader('Content-Type', 'text/plain');
          response.end("Error in server");

        case 3:
        case "end":
          return _context6.stop();
      }
    }
  });
} // Работа с БД


function viewDb(request, response) {
  // создаем подключение
  var connection = mysql.createConnection(connectionData);
  connection.connect(function (err) {
    if (err) {
      console.error(err);
      send500(response);
    } else {
      // const salt = crypto.createHash('sha1').update("321").digest('hex');
      // const pass = crypto.createHash('sha1').update("321" + salt).digest('hex');
      // response.end("Connection OK " + salt + " " + pass);
      // выполнение запросов
      connection.query("select * from users", function (err, results, fields) {
        if (err) {
          console.error(err);
          send500(response);
        } else {
          console.log(results);
          console.log("------");
          console.log(fields);
          var table = "<table>";
          table += "\n                    <caption>Users table</caption>\n                    <tr>\n                        <th>id</th>\n                        <th>login</th>\n                        <th>pass_salt</th>\n                        <th>pass_hash</th>\n                        <th>email</th>\n                        <th>picture</th>\n                    </tr>";
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = results[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              fields = _step3.value;
              table += "<tr><td>" + fields.id + "</td>";
              table += "<td>" + fields.login + "</td>";
              table += "<td>" + fields.pass_salt + "</td>";
              table += "<td>" + fields.pass_hash + "</td>";
              table += "<td>" + fields.email + "</td>";
              table += "<td>" + fields.picture + "</td></tr>";
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
                _iterator3["return"]();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          table += "</table>";
          response.end(table);
        }
      });
    }
  });
}

function viewDbPool(request, response) {
  var pool = mysql.createPool(connectionData);
  pool.query("select * from users", function (err, results, fields) {
    if (err) {
      console.error(err);
      send500(response);
    } else {
      console.log(results);
      console.log("------");
      console.log(fields);
      var table = "<table border=1 cellspacing=0>";
      table += "\n            <caption>Users table POOL</caption>\n            <tr>\n                <th>id</th>\n                <th>login</th>\n                <th>pass_salt</th>\n                <th>pass_hash</th>\n                <th>email</th>\n                <th>picture</th>\n            </tr>";
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = results[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          fields = _step4.value;
          table += "<tr><td>" + fields.id + "</td>";
          table += "<td>" + fields.login + "</td>";
          table += "<td>" + fields.pass_salt + "</td>";
          table += "<td>" + fields.pass_hash + "</td>";
          table += "<td>" + fields.email + "</td>";
          table += "<td>" + fields.picture + "</td></tr>";
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      table += "</table>";
      response.end(table);
    }
  });
}

function viewDb2(request, response) {
  // mysql2 - расширение mysql, поэтому поддерживает те же функции
  // + promise API
  var pool2 = mysql2.createPool(connectionData).promise();
  pool2.query("select * from users").then(function (_ref2) {
    var _ref3 = _slicedToArray(_ref2, 2),
        results = _ref3[0],
        fields = _ref3[1];

    var table = "<table border=1 cellspacing=0>";
    table += "\n                    <caption>Users table POOL</caption>\n                    <tr>\n                        <th>id</th>\n                        <th>login</th>\n                        <th>pass_salt</th>\n                        <th>pass_hash</th>\n                        <th>email</th>\n                        <th>picture</th>\n                    </tr>";
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = results[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        fields = _step5.value;
        table += "<tr><td>" + fields.id + "</td>";
        table += "<td>" + fields.login + "</td>";
        table += "<td>" + fields.pass_salt + "</td>";
        table += "<td>" + fields.pass_hash + "</td>";
        table += "<td>" + fields.email + "</td>";
        table += "<td>" + fields.picture + "</td></tr>";
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
          _iterator5["return"]();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    table += "</table>";
    response.end(table);
  })["catch"](function (err) {
    console.error(err);
    send500(response);
  });
}

function viewAuth(request, response) {
  var pool2 = mysql2.createPool(connectionData).promise();
  var salt = crypto.createHash('sha1').update(request.params.query.password).digest('hex');
  var pass = crypto.createHash('sha1').update(request.params.query.password + salt).digest('hex');
  var user = [request.params.query.login, pass];
  pool2.execute("SELECT * FROM users \n                   WHERE EXISTS \n                    (SELECT * \n                     FROM users \n                     WHERE login = ? AND pass_hash = ?)", user).then(function (_ref4) {
    var _ref5 = _slicedToArray(_ref4, 2),
        rows = _ref5[0],
        fields = _ref5[1];

    if (rows.length > 0) {
      console.log("Authorize successful");
      response.end("Authorize successful");
    } else {
      console.log("Incorrect login or password");
      response.end("Incorrect login or password");
    }
  })["catch"](function (err) {
    console.error(err);
    send500(response);
  }); //response.end(request.params.query.login + " " + request.params.query.password);
}

function viewJunk(request, response) {
  sendFile(WWW_ROOT + "/junk.html", response);
}

function viewDownload(request, response) {
  global.services.dbPool.execute("SELECT filename FROM pictures WHERE id = ?", [request.params.query.picId], function (err, results) {
    if (err) {
      console.log(err);
      response.errorHandlers.send500();
    } else {
      response.setHeader('Content-Type', 'application/octet-stream');
      response.setHeader('Content-Disposition', 'attachment; ' + "filename=\"".concat(results[0].filename, "\"")); // TODO: set name for file

      fs.createReadStream(UPLOAD_PATH + results[0].filename).pipe(response);
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