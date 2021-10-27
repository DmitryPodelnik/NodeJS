
const HTTP_PORT = 80;
const WWW_ROOT = "www";
const FILE_404 = WWW_ROOT + "/404.html";
const INDEX_HTML = WWW_ROOT + "/index.html";
const DEFAULT_MIME = "application/octet-stream";
const UPLOAD_PATH  = WWW_ROOT + "/pictures/";

module.exports = {
    analyze: function(request, response) {
        console.log("User controller works!");
        
        response.end("User controller works!");
    },
};