const crypto = require('crypto');

module.exports = {
    analyze: function (request, response) {
        // response.setHeader('Access-Control-Allow-Origin', '*');
        // CORS
        // без указания - проходят только OPTIONS, GET, POST
        const method = request.method.toUpperCase();
        switch (method) {
            case 'GET':  // возврат списка картинки
                doGet(request, response);
                break;
            case 'POST':  // загрузка новой картинки
                doPost(request, response);
                break;
            case 'PUT': //
                doPut(request, response);
                break;
            case 'DELETE': //
                doDelete(request, response);
                break;
            case 'OPTIONS': //
                doOptions(request, response);
                break;

        };
    },
};

function doGet(request, response) {
    // server-side validation 
    let errorMessage = "";
    let userLogin, userPassword;
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
    }
    // end of validation

    // authorization  -get id by log/pass
    getUserByLogin(userLogin)
        .then(results => {
            if (results.length > 0) {
                const pass = crypto
                    .createHash('sha1')
                    .update(userPassword + results[0].pass_salt)
                    .digest('hex');
                if (results[0].pass_hash == pass) {
                    let userId = results[0].id_str;
                    updateUserAuthData(userId);
                    response.setHeader('Set-Cookie', `session-id=${userId};max-age=10;path=/`);
                    response.end (userId) ;
                    return;
                }
            }
            response.end("0");
        }).catch(err => { console.log(err); response.errorHandlers.send500(); });
}

async function getUserByLogin(login) {
    return new Promise((resolve, reject) => {
        global.services.dbPool.execute(
            'SELECT u.*, CAST(u.id AS CHAR) id_str FROM users u WHERE u.login = ?',
            [login],
            (err, result) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
    });
}

function updateUserAuthData(id) {
    global.services.dbPool.execute(
        'UPDATE users SET auth_DT = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        err => {
            if (err) {
                console.log(err);  // updateUserAuthData + " " + 
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