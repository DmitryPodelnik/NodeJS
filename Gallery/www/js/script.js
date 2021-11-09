document.addEventListener("submit", (e) => {
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

    formData.append("users_id", findUserId());


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

    findUserId();

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

function findUserId() {
    // user-id (if present) -- <div... id="user-block" user-id="{{id_str}}"
    const userBlock = document.getElementById("user-block");
    if (userBlock) {
        const userId = userBlock.getAttribute("user-id");
        if (userId) {
            return userId;
        }
    }
    return null;
}

document.addEventListener("DOMContentLoaded", () => {
    loadPictures();

    // вариант 1
    // const cont = document.querySelector("#gallery-container");
    // cont.innerHTML = t;

    // вариант 2 !!!
    /*
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
    */

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
});

async function addToolButtonListeners() {
    for (let b of document.querySelectorAll('.tb-delete')) {
        b.addEventListener('click', tbDelClick);
    }
    for (let b of document.querySelectorAll('.tb-edit')) {
        b.addEventListener('click', tbEditClick);
    }
    for (let b of document.querySelectorAll('.tb-download')) {
        b.addEventListener('click', tbDownloadClick);
    }
}

function tbDelClick(e) {

    if (!confirm('Are you sure you want to delete?')) {
        return;
    }

    const div = e.target.closest('div');
    const picId = div.getAttribute('picId');
    // console.log(picId);
    fetch("/api/picture", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json'
        },
        body: `{"id": "${picId}"}`
    })
        .then(r => r.json())
        .then(j => {
            // в ответе сервера должно быть поле result, в нем (affectedRows)
            // если 1 - было удаление, 0 - не было
            if (typeof j.result == 'undefined') {
                alert("Some error");
            }
            else if (j.result == 1) {
                alert("Delete completed!")
                // удалить div из контейнера картинок
                div.remove();
            }
            else {
                alert("Deleted failed")
            }
        });
}

function tbEditClick(e) {
    const div = e.target.closest('div');
    const picId = div.getAttribute('picId');
    console.log(picId);

    const place = div.querySelector('i > span');
    if (!place) {
        throw "EditClick: place(<i>) not found";
    }
    const description = div.querySelector('p > span');
    if (!description) {
        throw "EditClick: description(<p>) not found";
    }

    // toggle effect
    if (typeof div.savedPlace == 'undefined') {  // first click
        div.savedPlace = place.innerHTML;
        div.savedDescription = description.innerHTML;
        div.querySelector('.tb-edit').className = 'tb-save';
        // editable content
        place.setAttribute('contenteditable', 'true');
        description.setAttribute('contenteditable', 'true');
        description.focus();

        console.log(div.savedPlace, div.savedDescription);
    } else {  // second click
        // no changes - no fetch
        // one field changed - one field fetched
        let data = {};
        if (div.savedPlace != place.innerHTML) {
            data.place = place.innerHTML;
        }
        if (div.savedDescription != description.innerHTML) {
            data.description = description.innerHTML;
        }

        let savedPlace = div.savedPlace;
        let savedDescription = div.savedDescription;

        if (Object.keys(data).length > 0) {
            data.id = picId;
            fetch("/api/picture", {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(r => r.text())
                .then(res => {
                    let data = JSON.parse(res);
                    console.log(res);
                })
                .catch(err => {
                    alert("error");
                    description.innerHTML = savedDescription;
                    place.innerHTML = savedPlace;
                })
        }

        delete div.savedPlace;
        delete div.savedDescription;
        place.removeAttribute('contenteditable');
        description.removeAttribute('contenteditable');
        div.querySelector('.tb-save').className = 'tb-edit';
    }

}

document.addEventListener('keydown', (e) => {
    if (event.code == 'Escape') {
        const div = document.querySelector('#gallery-container');
        let saveBtns = div.querySelectorAll('.tb-save');
        for (let prop of saveBtns) {
            prop.className = 'tb-edit';
        }

        let fields = div.querySelectorAll('p > span, i > span');
        for (let prop of fields) {
            prop.removeAttribute('contenteditable');
        }
    }
});

function tbDownloadClick(e) {
    const div = e.target.closest('div');
    const picId = div.getAttribute('picId');
    console.log(picId);
    window.location = "/download?picId=" + picId;
}

async function authUser(txt) {
    // txt = 0 || user Id
    if (txt == "0") {
        alert("Authorization declined");
    } else {
        const userLogin = document.querySelector('input[type=text]');
        if (!userLogin) {
            throw "User login not found";
        }

        setCookie("login", userLogin.value, {
            'max-age': 7200
        });
        loadAuthContainer();
    }
    console.log(txt);
}

document.addEventListener("DOMContentLoaded", loadAuthContainer);

function setCookie(name, value, options = {}) {

    options = {
        path: '/',
        // при необходимости добавить другие значения по умолчанию
        ...options
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}

function deleteCookie(name) {
    setCookie(name, "", {
        'max-age': -1
    });
}

// возвращает куки с указанным name,
// или undefined, если ничего не найдено
function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

async function authControls() {
    // user-block - auth
    const userBlock = document.querySelector('#user-block');
    if (!userBlock) {
        throw "userBlock not found";
    }
    // button click 
    const logBtn = userBlock.querySelector('input[type=button]');
    if (!logBtn) {
        throw "logIn button not found";
    }
    if (userBlock.classList.contains('user-block-auth')) {  // Выход
        logBtn.addEventListener('click', () => {
            fetch(`/api/user?logout`)
                .then(r => r.text())
                .then(loadAuthContainer);
        });
        // selector - filter <select id="filter-shown"
        const filterShown = document.getElementById('filter-shown');
        if (filterShown) {
            filterShown.addEventListener('change', filterShownChange);
        }

    } else {  // вход

        logBtn.addEventListener('click', () => {
            // if (document.cookie.indexOf('user-id') !== -1) {
            //     deleteCookie('user-id');
            //     loadAuthContainer();

            //     return;
            // }
            const userLogin = userBlock.querySelector('input[type=text]');
            if (!userLogin) {
                throw "User login not found";
            }
            const userPassword = userBlock.querySelector('input[type=password]');
            if (!userPassword) {
                throw "User password not found";
            }
            // validation
            if (userLogin.value.length == 0) {
                alert("Login cannot be empty");
                return;
            }

            if (userPassword.value.length == 0) {
                alert("Password cannot be empty");
                return;
            }
            fetch(`/api/user?userLogin=${userLogin.value}&userPassword=${userPassword.value}`)
                .then(r => r.text())
                .then(authUser);

            // console.log(userLogin.value, userPassword.value);
        });
    }
}

async function loadAuthContainer() {
    const cont = document.querySelector("#auth_container");
    if (!cont) {
        throw "auth_container not found";
    }
    fetch('/templates/auth1.tpl')
        .then(r => r.text())
        .then(tpl => {
            cont.innerHTML = tpl;  // tpl.replace("{{login}}", getCookie('login'));
            authControls();
        });
}

function loadPictures(filter) {
    let url = "/api/picture";
    if (typeof filter != "undefined" &&
        typeof filter["userMode"] != "undefined") {
        if (filter["userMode"] == 1) {
            url += "?userid=" + findUserId();
        }
        else if (filter["userMode"] == 2) {  // not own
            url += "?exceptid=" + findUserId();
        } else {  // all

        }
    }

    fetch(url)
        .then(r => r.text())
        .then(t => {
            // console.log(t);
            const j = JSON.parse(t); // или .then(r => r.json())
            const cont = document.querySelector("#gallery-container");

            // вариант 4

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
                });
        });
}

function filterShownChange(e) {
    // console.log(e.target.value);
    loadPictures({ userMode: e.target.value });
}

// ---------- PAGINATION ----------
document.addEventListener("DOMContentLoaded", () => {
    const prevPageButton = document.getElementById('prevPageButton');
    if (!prevPageButton) {
        throw "Pagination: prevPageButton not found";
    }
    const nextPageButton = document.getElementById('nextPageButton');
    if (!nextPageButton) {
        throw "Pagination: nextPageButton not found";
    }

    prevPageButton.addEventListener('click', prevPageButtonClick);
    nextPageButton.addEventListener('click', nextPageButtonClick);
});

function prevPageButtonClick(e) {
    const paginationBlock = e.target.parentNode;
    let page = paginationBlock.getAttribute('page-number');
    if (page > 1) {
        page--;
        paginationBlock.setAttribute("page-number", page);
    }
    console.log(page);
}

function nextPageButtonClick(e) {
    const paginationBlock = e.target.parentNode;
    let page = paginationBlock.getAttribute('page-number');
    if (page < 10) {
        page++;
        paginationBlock.setAttribute("page-number", page);
    }
    console.log(page);
}