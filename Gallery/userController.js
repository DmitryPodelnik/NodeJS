
const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML = WWW_ROOT + "/index.html";
const DEFAULT_MIME = "application/octet-stream";
const UPLOAD_PATH  = WWW_ROOT + "/pictures/";

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

    response.end(JSON.stringify(request.params.query));
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