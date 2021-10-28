document.addEventListener("submit",(e)=>{
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector("input[name=title]");
    if (!title) {
        throw "Data transfer error: input[name=title] not found";
    }
    const descr = form.querySelector("input[name=description]");
    if (!descr) {
        throw "Data transfer error: input[name=description] not found";
    }
    const place = form.querySelector("input[name=place]");
    if (!place) {
        throw "Data transfer error: input[name=place] not found";
    } 
    const picture = form.querySelector("input[name=picture]");
    if (!picture) {
        throw "Data transfer error: input[name=picture] not found";
    }
    // TODO: data validation

    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("description", descr.value);
    // place optional, include if not empty
    if (place.value.length > 0) {
        formData.append("place", place.value);
    }
    formData.append("picture", picture.files[0]);


    // Exercise: 
    // Обеспечить передачу параметров в формате JSON
    // (данные формы преобр. в JSON и передаются запросом PUT)
/*
    const formDataJson = new FormData();
    formDataJson.append("title", JSON.stringify(title.value));
    formDataJson.append("description", JSON.stringify(descr.value));
    // place optional, include if not empty
    if (place.value.length > 0) {
        formDataJson.append("place", JSON.stringify(place.value));
    }
    formDataJson.append("picture", JSON.stringify(picture.files[0]));

    fetch("/api/picture", {
        method: "PUT",
        body: formData
    })
    .then(res => res.json())
    .then(console.log);
*/


    fetch("/api/picture", {
        method: "POST",
        body: formData  // new URLSearchParams(formData).toString()
    })
    .then(res => res.json())
    .then(res => {
        console.log(res);

        /*
        let galleryElement = document.querySelector("#gallery");

        let imgElement = document.createElement("img");
        imgElement.src = res.params.savedPictureUrl; 
        imgElement.onload = function() {
            if (this.width + this.height == 0) {
                   this.onerror();
                   return;
            }

            let descriptionElem = document.createElement("p");
            descriptionElem.innerText = "Description: " + descr.value;
            galleryElement.append(descriptionElem);

            if (place) {
                let placeElem = document.createElement("p");
                placeElem.innerText = "Place: " + place.value;
                galleryElement.append(placeElem);
            }

            let form = document.querySelector(".add-image-form");
            form.reset();
       }

       imgElement.onerror = function() {
            alert("Image display error!"); 
       }

       galleryElement.append(imgElement);
       */
    });
    
});

document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/picture")
    .then(r => r.text())
    .then(t => {
        console.log(t);
        const j = JSON.parse(t); // или .then(r => r.json())

        // вариант 1
        // const cont = document.querySelector("#gallery-container");
        // cont.innerHTML = t;

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

        // вариант 3
        /*
        for (let p of j) {
            
            const div = document.createElement("div");
            div.style.border = "1px solid black";
            div.style.display = "inline-block";

            const img = document.createElement("img");
            img.src="/pictures/" + p.filename;
            img.style["max-width"] = "150px";

            const title = document.createElement("p");
            title.innerText = "Title: " + p.title;

            const descr = document.createElement("p");
            descr.innerText = "Description: " + p.description;

            const place = document.createElement("p");

            div.appendChild(img);
            div.appendChild(title);
            div.appendChild(descr);

            if (p.place) {
                place.innerText = "Place: " + p.place;
            } else {
                place.innerText = "Place: ";
            }

            div.appendChild(place);
            cont.appendChild(div);
            
            cont.innerHTML += tpl.replace("{{filename}}", p.filename);
        }
        */

        // вариант 4
        /*
        fetch("/templates/picture.tpl")
        .then(r => r.text())
        .then(tpl => {
            let html = "";
            for (let p of j) {
                html += tpl.replace("{{id}}", p.id)
                           .replace("{{title}}", p.title)
                           .replace("{{description}}", p.description)
                           .replace("{{place}}", p.place)
                           .replace("{{filename}}", p.filename);
            }
            cont.innerHTML = html;
        })
        */
    });
});


/* 
    В случае удачной загрузки изображения, вывести (добавить на страницу) 
    эту картинку и описание / место (если есть) + очистить форму.
    В случае неудачной - вывести (alert) и не очищать форму.
*/