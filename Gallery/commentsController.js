
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
    getComments()
    .then(res => {
        console.log(res);

        response.end(JSON.stringify({
            "comments": res,
        }));
    });
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
    deleteComment(request)
    .then(res => {
        //console.log(res);

        response.end(JSON.stringify({
            "result": res.affectedRows,
        }));
    });
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

function deleteComment(request) {
    const sql = "DELETE FROM comments WHERE id = ?";
    // console.log(request.params.query.commentId);
 
     return new Promise((resolve, reject) => {
         global.services.dbPool.execute(
             sql,
             [request.params.query.commentId],
             (err, results) => {
                 if (err) {
                     reject(err);
                 } else {
                     resolve(results);
                 }
             })
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

function getComments() {
    const sql = "SELECT CAST(comments.id AS CHAR) id, users.login, CAST(comments.user_id AS CHAR) user_id, CAST(comments.picture_id AS CHAR) picture_id, comments.comment FROM comments JOIN users ON comments.user_id = users.id";

    return new Promise((resolve, reject) => {
        global.services.dbPool.execute(
            sql,
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            })
    });
}