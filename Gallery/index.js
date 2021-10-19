// Сервер на JS
const HTTP_PORT = 88;

// Подключение модуля
const http = require('http');

// Серверная функция
function serverFunction(request, response) {
    console.log(request.method + " " + request.url);

    const url = request.url.substring(1)
    if (url === '') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        response.end("<h1>Home, sweet Home</h1>"); // ~getWriter().print
    }
    else if (url === 'hello') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        response.end("<h1>Hello, world</h1>"); // ~getWriter().print
    } 
    else if (url === 'js') {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html');
        response.end("<h1>Node is cool</h1>"); // ~getWriter().print
    }
    else {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/html');
        response.end("<h1>Not Found</h1>"); // ~getWriter().print
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
