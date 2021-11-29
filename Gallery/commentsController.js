
module.exports = {
    analyze: function (request, response) {
        // response.setHeader('Access-Control-Allow-Origin', '*');
        // CORS
        // без указания - проходят только OPTIONS, GET, POST
        const method = request.method.toUpperCase();
        switch (method) {
            case 'GET': 
                doGet(request, response);
                break;
            case 'POST':
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
    response.end("Comments works");
}

function doPost(request, response) {
    let chunks = [];
    request.on("data", chunk => {
        chunks.push(chunk);
    })
        .on("end", () => {
            const body = JSON.parse(Buffer.concat(chunks).toString());
            validateOrm(body)
                .then(addComment)
                .then(results => {
                    response.end(JSON.stringify({
                        "result": results.affectedRows
                    }));
                })
                .catch(err => {
                    console.log(err);
                    response.errorHandlers.send500(err);
                });
        });
}

function doPut(request, response) {
    
}

function doDelete(request, response) {

}

function doOptions(request, response) {

}

function validateOrm(body) {
    return new Promise((resolve, reject) => {
        const orm = ["user_id", "picture_id", "comment"];

        for (let prop in body) {
            if (orm.indexOf(prop) == -1) {
                reject("ORM error: unexpected field " + prop);
            }
            resolve(body);
        }
    });
}

function addComment(body) {
    const params = [body.user_id, body.picture_id, body.comment];
    const sql = "INSERT INTO comments (user_id, picture_id, comment) VALUES(?, ?, ?)";

    return new Promise((resolve, reject) => {
        global.services.dbPool.execute(
            sql,
            params,
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            })

    });
}