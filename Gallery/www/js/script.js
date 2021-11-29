document.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;

    const title = form.querySelector("input[name=title]");
    if (!title) throw "Data transfer error: input[name=title] not found";

    const descr = form.querySelector("input[name=description]");
    if (!descr) throw "Data transfer error: input[name=description] not found";
    const place = form.querySelector("input[name=place]");
    if (!place) throw "Data transfer error: input[name=place] not found";
    const picture = form.querySelector("input[name=picture]");
    if (!picture) throw "Data transfer error: input[name=picture] not found";
    // TODO: data validation

    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("description", descr.value);
    // place optional, include if not empty
    if (place.value.length > 0)
        formData.append("place", place.value);
    formData.append("picture", picture.files[0]);
    formData.append("users_id", findUserId());
    fetch("/api/picture", {
        method: "POST",
        body: formData  // new URLSearchParams(formData).toString()
    }).then(r => r.text()).then(console.log);

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
    // создаем объект galleryWindow
    window.galleryWindow = {
        state: {},
        changeState: s => {
            if (typeof s == 'undefined') {
                return;
            }
            const state = window.galleryWindow.state;

            if (typeof s["pageNumber"] != 'undefined') {
                state.pageNumber = s["pageNumber"];
            }

            if (typeof s["userMode"] != 'undefined' && s["userMode"] != state.userMode) {
                state.userMode = s["userMode"];
                state.pageNumber = 1;
            }

            let url = "/api/picture?page=" + state.pageNumber;
            if (state.userMode == 1) {
                url += "&userid=" + findUserId();
            }
            else if (state.userMode == 2) {  // not own
                url += "&exceptid=" + findUserId();
            } else {  // all

            }

            window.fetchUrl = url;

            fetch(url)
                .then(r => r.text())
                .then(t => {
                    const j = JSON.parse(t); // или .then(r => r.json())
                    const cont = document.querySelector("#gallery-container");

                    fetch("/templates/picture1.tpl")
                        .then(r => r.text())
                        .then(tpl => {
                            let html = "";
                            for (let p of j.data) {
                                html += tpl.replace("{{id}}", p.id_str)
                                    .replace("{{title}}", p.title)
                                    .replace("{{description}}", p.description)
                                    .replace("{{place}}", p.place)
                                    .replace("{{filename}}", p.filename)
                                    .replace("{{rating}}", p.rating);
                            }
                            cont.innerHTML = html;
                            window.galleryWindow.state.pageNumber = j.meta.currentPage;
                            window.galleryWindow.state.lastPage = j.meta.lastPage;

                            let lastPageNumber = document.getElementById('lastPageNumber');
                            lastPageNumber.innerText = window.galleryWindow.state.lastPage;

                            addToolButtonListeners();
                            document.dispatchEvent(new CustomEvent(
                                "galleryWindowChange",
                                { detail: window.galleryWindow.state }
                            ));
                        });
                });
        }
    };
    window.galleryWindow.changeState({ pageNumber: 1, userMode: 0 });
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
    if (e.code == 'Escape') {
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
        loadGalleryContainer();
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
                .then(() => {
                    loadAuthContainer();
                    loadGalleryContainer();
                });
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

async function loadGalleryContainer() {
    const cont = document.querySelector("#gallery-container");
    if (!cont) {
        throw "gallery-container not found";
    }

    fetch(window.fetchUrl)
        .then(r => r.text())
        .then(t => {
            const j = JSON.parse(t); // или .then(r => r.json())
            fetch('/templates/picture1.tpl')
                .then(r => r.text())
                .then(tpl => {

                    let html = "";
                    for (let p of j.data) {
                        html += tpl.replace("{{id}}", p.id_str)
                            .replace("{{title}}", p.title)
                            .replace("{{description}}", p.description)
                            .replace("{{place}}", p.place)
                            .replace("{{filename}}", p.filename)
                            .replace("{{rating}}", p.rating);
                    }
                    cont.innerHTML = html;
                    window.galleryWindow.state.pageNumber = j.meta.currentPage;
                    window.galleryWindow.state.lastPage = j.meta.lastPage;

                    let lastPageNumber = document.getElementById('lastPageNumber');
                    lastPageNumber.innerText = window.galleryWindow.state.lastPage;

                    addToolButtonListeners();
                    document.dispatchEvent(new CustomEvent(
                        "galleryWindowChange",
                        { detail: window.galleryWindow.state }
                    ));
                });
        });
    window.galleryWindow.changeState({ pageNumber: 1, userMode: 0 });
}

function filterShownChange(e) {
    window.galleryWindow.changeState({ userMode: e.target.value });
}

// ---------- PAGINATION ----------
document.addEventListener("DOMContentLoaded", () => {
    const prevPageButton = document.getElementById('prevPageButton');
    if (!prevPageButton) {
        throw "Pagination: prevPageButton not found";
    }

    if (window.galleryWindow.state.pageNumber == 1) {
        prevPageButton.setAttribute('disabled', true);
    }

    prevPageButton.addEventListener('click', prevPageButtonClick);
    nextPageButton.addEventListener('click', nextPageButtonClick);
});

function prevPageButtonClick(e) {
    const paginationBlock = e.target.parentNode;
    let page = window.galleryWindow.state.pageNumber;
    if (page > 1) {
        page--;
        window.galleryWindow.changeState({ pageNumber: page });
    }
}

function nextPageButtonClick(e) {
    const paginationBlock = e.target.parentNode;
    let page = window.galleryWindow.state.pageNumber;
    if (page < window.galleryWindow.state.lastPage) {
        page++;
        window.galleryWindow.changeState({ pageNumber: page });
    }
}

function currentPageNumberListener(e) {
    window.currentPageNumber.innerText = e.detail.pageNumber;
}

document.addEventListener("galleryWindowChange", currentPageNumberListener);

// -------- VOTES --------
function voteHandler(e) {
    let vote = e.target.classList.contains("vote-dislike")
        ? -1
        : 1;

    const userId = findUserId();
    const pictire_id = e.target.closest("[picId]").getAttribute("picId");

    fetch("/api/votes", {
        method: "post",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "users_id": userId,
            "pictire_id": pictire_id,
            "vote": vote,
        })
    })
        .then(r => r.json())
        .then(r => {
            if (r.result == 1) {
                let votes = e.target.closest(".vote").querySelector('.vote-total');
                votes.innerText = +votes.innerText + vote;
            }
        });
}
function setVotesHandlers() {
    for (let v of document.querySelectorAll('.vote-like, .vote-dislike')) {
        v.onclick = voteHandler;
    }
}

function buttonSwitcher() {
    if (window.galleryWindow.state.pageNumber == 1) {
        window.prevPageButton.setAttribute("disabled", true);
    }
    else {
        window.prevPageButton.removeAttribute("disabled");
    }

    if (window.galleryWindow.state.pageNumber == window.galleryWindow.state.lastPage) {
        window.nextPageButton.setAttribute("disabled", true);
    }
    else {
        window.nextPageButton.removeAttribute("disabled");
    }
}

document.addEventListener('galleryWindowChange', setVotesHandlers);
document.addEventListener("galleryWindowChange", buttonSwitcher);