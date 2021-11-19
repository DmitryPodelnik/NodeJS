
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
    response.end("Votes works");
}

function doPost(request, response) {
    let chunks = [];
    requests.on("data", chunk => {
        chunks.push(chunk);
    })
    .on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        validateOrm(body)
        .then(addVote)
        .then(results => {

        })
        .catch(err => {

        });
        // response.end(`POST Votes works !! user_id = ${body.users_id}, picture_id = ${body.picture_id}, vote = ${body.vote}`);
    });
}

function doPut(request, response) {

}

function doDelete(request, response) {

}

function doOptions(request, response) {

}