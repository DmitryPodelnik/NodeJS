document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/picture?deleted")
    .then(r => r.text())
    .then(t => {
        console.log(t);
        const j = JSON.parse(t); // или .then(r => r.json())

        // вариант 4
        /*
        fetch("/templates/picture.tpl")
        .then(r => r.text())
        .then(tpl => {
            let html = "";
            for (let p of j) {
                html += tpl.replace("{{id}}", p.id_str)
                           .replace("{{title}}", p.title)
                           .replace("{{description}}", p.description)
                           .replace("{{place}}", p.place)
                           .replace("{{filename}}", p.filename);
            }
            cont.innerHTML = html;
            addToolButtonListeners();
        })
        */

        // вариант 2
        const cont = document.querySelector("#gallery-container");
        let res = `<div style="display: flex; flex-direction: row; 
                               flex-wrap: wrap; 
                               justify-content: space-between;
                               background-color: moccasin;" 
                        >`;
        for (let pic of j.results) {
            let tempStr = j.template;
            tempStr = tempStr.replace("{{filename}}", pic.filename);
            tempStr = tempStr.replace("{{title}}", pic.title);
            tempStr = tempStr.replace("{{description}}", pic.description);
            if (pic.place) {
                tempStr = tempStr.replace("{{place}}", pic.place);
            } else {
                tempStr = tempStr.replace("{{place}}", " ");
            }
            res += tempStr;
        }
        res += '</div>';
        cont.innerHTML = res;

        
    });
});

async function addToolButtonListeners() {
    for (let b of document.querySelectorAll('.tb-recover')) {
        b.addEventListener('click', tbRecover);
    }
}

function tbRecover(e) {
    const div = e.target.closest('div');
    const picId = div.getAttribute('picId');
    console.log(picId);
    
    fetch("/api/picture", {
        method: "put",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: picId,
            delete_DT: null,
        })
    })
    .then(r => r.json())
    .then(console.log)
    // .then(j => {
    //     // в ответе сервера должно быть поле result, в нем (affectedRows)
    //     // если 1 - было удаление, 0 - не было
    //     if (typeof j.result == 'undefined') {
    //         alert("Some error");
    //     }
    //     else if (j.result== 1) {
    //         alert("Delete completed!")
    //         // удалить div из контейнера картинок
    //         div.remove();
    //     }
    //     else {
    //         alert("Deleted fail")
    //     }
    // });
}