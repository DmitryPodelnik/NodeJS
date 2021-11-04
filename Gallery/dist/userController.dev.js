"use strict";

var crypto = require('crypto');

module.exports = {
  analyze: function analyze(request, response) {
    // response.setHeader('Access-Control-Allow-Origin', '*');
    // CORS
    // без указания - проходят только OPTIONS, GET, POST
    var method = request.method.toUpperCase();

    switch (method) {
      case 'GET':
        // возврат списка картинки
        doGet(request, response);
        break;

      case 'POST':
        // загрузка новой картинки
        doPost(request, response);
        break;

      case 'PUT':
        //
        doPut(request, response);
        break;

      case 'DELETE':
        //
        doDelete(request, response);
        break;

      case 'OPTIONS':
        //
        doOptions(request, response);
        break;
    }

    ;
  }
};

function doGet(request, response) {
  // server-side validation 
  var errorMessage = "";
  var userLogin, userPassword;

  if (typeof request.params.query.userLogin == 'undefined') {
    errorMessage = 'userLogin required';
  } else {
    userLogin = request.params.query.userLogin;

    if (userLogin.length == 0) {
      errorMessage = 'userLogin should be not empty';
    }
  }

  if (typeof request.params.query.userPassword == 'undefined') {
    errorMessage = 'userPassword required';
  } else {
    userPassword = request.params.query.userPassword;

    if (userPassword.length == 0) {
      errorMessage = 'userPassword should be not empty';
    }
  }

  if (errorMessage.length > 0) {
    response.errorHandlers.send412(errorMessage);
    return;
  } // end of validation
  // authorization  -get id by log/pass


  getUserByLogin(userLogin).then(function (results) {
    if (results.length > 0) {
      var pass = crypto.createHash('sha1').update(userPassword + results[0].pass_salt).digest('hex');

      if (results[0].pass_hash == pass) {
        var userId = results[0].id_str;
        updateUserAuthData(userId);
        response.setHeader('Set-Cookie', "user-id=".concat(userId, ";max-age=10;path=/"));
        response.end(userId);
        return;
      }
    }

    response.end("0");
  })["catch"](function (err) {
    console.log(err);
    response.errorHandlers.send500();
  });
}

function getUserByLogin(login) {
  return regeneratorRuntime.async(function getUserByLogin$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", new Promise(function (resolve, reject) {
            global.services.dbPool.execute('SELECT u.*, CAST(u.id AS CHAR) id_str FROM users u WHERE u.login = ?', [login], function (err, result) {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve(result);
              }
            });
          }));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
}

function updateUserAuthData(id) {
  global.services.dbPool.execute('UPDATE users SET auth_DT = CURRENT_TIMESTAMP WHERE id = ?', [id], function (err) {
    if (err) {
      console.log(err); // updateUserAuthData + " " + 
    }
  });
}

function doPost(request, response) {
  response.end("POST");
}

function doPut(request, response) {
  response.end("PUT");
}

function doDelete(request, response) {
  response.end("DELETE");
}

function doOptions(request, response) {
  response.end("OPTIONS");
}