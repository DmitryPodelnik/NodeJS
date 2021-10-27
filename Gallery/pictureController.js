
const formidable = require("formidable");   // Form parser
const fs         = require("fs");           // file system

const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML = WWW_ROOT + "/index.html";
const DEFAULT_MIME = "application/octet-stream";
const UPLOAD_PATH  = WWW_ROOT + "/pictures/";

module.exports = {
    analyze: function (request, response) {
        const method = request.method.toUpperCase();
        switch(method) {
            case 'GET':  // возврат списка картинки
                doGet(request, response);
                break;
            case 'POST':  // загрузка новой картинки
                doPost(request, response);
                break;
            case 'PUT': //
                doPut(request, response);
                break;

        };
    },
    
};
function doGet(request, response) {
    // Возврат JSON данных по всем картинкам
    request.services.dbPool.execute("SELECT * FROM pictures", (err, results) => {
        if (err) {
            console.log(err);
            response.errorHandlers.send500(response);
        } else {
            // вариант 1
            /*
            let res = `<div style="display: flex; flex-direction: row; 
                                   flex-wrap: wrap; 
                                   justify-content: space-between;" 
                            class="card">`;
            for (let pic of results) {
                let tempStr = `
                                <div class="card">
                                    <img style="max-width: 100px" src="/pictures/{{filename}}" />
                                    <h5 class="card-title">Title: {{title}}</h5>
                                    <p class="card-text">Description: {{description}}</p>
                                    <p class="card-text">Place: {{place}}</p>
                                </div>`;

                tempStr = tempStr.replace("{{filename}}", pic.filename);
                tempStr = tempStr.replace("{{title}}", pic.title);
                tempStr = tempStr.replace("{{description}}", pic.description);
                if (pic.place) {
                    tempStr = tempStr.replace("{{place}}", pic.place);
                } else {
                    tempStr = tempStr.replace("{{place}}", "Place: ");
                }
                res += tempStr;
            }
            res += '</div>';

            response.end(res);
            */

            // вариант 2
            let res = {
                "template": `
                        <div class="card">
                           <img style="max-width: 100px" src="/pictures/{{filename}}" />
                           <h5 class="card-title">Title: {{title}}</h5>
                           <p class="card-text">Description: {{description}}</p>
                           <p class="card-text">Place: {{place}}</p>
                        </div>`,
                "results": results,
            };
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(res));

            //response.setHeader('Content-Type', 'application/json');
            //response.end(JSON.stringify(results));
        }
    });
};

function doPost(request, response) {
    const formParser = formidable.IncomingForm();
    formParser.parse(request, (err, fields, files) => {
        if (err) {
            console.error(err);
            response.errorHandlers.send500(response);
            return;
        }
        let validateRes = validatePictureForm(fields, files);
        if (validateRes === true) {
            // OK
            const savedName = moveUploadedFile(files.picture)
            if (savedName !== "uploadError") {     
               // res.params.savedPictureUrl = "/pictures/" + savedName;  

               addPicture({
                title:       fields.title,
                description: fields.description,
                place:       fields.place,
                filename:    savedName,
            }, request.services)
            .then(results => {
                res = { status: results.affectedRows } ;
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(res));
            })
            .catch(err => {
                console.error(err);
                response.errorHandlers.send500(response);
            });
            } else {
                console.log("Image uploading error!");
                return;
            }
        } else {
            // Validation error,validateRes - message
            response.errorHandlers.send412(validateRes, response);
            return;
        }
    });
};

function doPut(request, response) {
    // Возврат JSON данных 
    const formParser = formidable.IncomingForm();
    formParser.parse(request, (err, fields, files) => {
        if (err) {
            console.error(err);
            response.errorHandlers.send500(response);
            return;
        }
        
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(fields));
    });
};

function addPicture(pic, services) {
    const query = 'INSERT INTO pictures (title, description, place, filename ) VALUES (?, ?, ?, ?)';
    const params = [
        pic.title, 
        pic.description, 
        pic.place, 
        pic.filename,
    ];
    return new Promise((resolve, reject) => {
        services.dbPool.query(query, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });


}

function validatePictureForm(fields, files) {
    // задание: проверить поля на наличие и допустимость
    
    // title should be
    if (typeof fields["title"] == 'undefined') {
        return "Title required";
    }
    if (fields["title"].length == 0) {
        return "Title should be non-empty";
    }
    // description should be 
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

function moveUploadedFile(file) {
    var counter = 1;
    var savedName;
    do {
        // TODO: trim filename to 64 symbols
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