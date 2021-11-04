"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

document.addEventListener("submit", function (e) {
  e.preventDefault();
  var form = e.target;
  var title = form.querySelector("input[name=title]");

  if (!title) {
    throw "Data transfer error: input[name=title] not found";
  }

  var descr = form.querySelector("input[name=description]");

  if (!descr) {
    throw "Data transfer error: input[name=description] not found";
  }

  var place = form.querySelector("input[name=place]");

  if (!place) {
    throw "Data transfer error: input[name=place] not found";
  }

  var picture = form.querySelector("input[name=picture]");

  if (!picture) {
    throw "Data transfer error: input[name=picture] not found";
  } // TODO: data validation


  var formData = new FormData();
  formData.append("title", title.value);
  formData.append("description", descr.value); // place optional, include if not empty

  if (place.value.length > 0) {
    formData.append("place", place.value);
  }

  formData.append("picture", picture.files[0]); // Exercise: 
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
    body: formData // new URLSearchParams(formData).toString()

  }).then(function (res) {
    return res.json();
  }).then(function (res) {
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
document.addEventListener("DOMContentLoaded", function () {
  fetch("/api/picture").then(function (r) {
    return r.text();
  }).then(function (t) {
    // console.log(t);
    var j = JSON.parse(t); // или .then(r => r.json())

    var cont = document.querySelector("#gallery-container"); // вариант 4

    fetch("/templates/picture.tpl").then(function (r) {
      return r.text();
    }).then(function (tpl) {
      var html = "";
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = j[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var p = _step.value;
          html += tpl.replace("{{id}}", p.id_str).replace("{{title}}", p.title).replace("{{description}}", p.description).replace("{{place}}", p.place).replace("{{filename}}", p.filename);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      cont.innerHTML = html;
      addToolButtonListeners();
    }); // вариант 1
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
});

function addToolButtonListeners() {
  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, b, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, _b, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _b2;

  return regeneratorRuntime.async(function addToolButtonListeners$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context.prev = 3;

          for (_iterator2 = document.querySelectorAll('.tb-delete')[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            b = _step2.value;
            b.addEventListener('click', tbDelClick);
          }

          _context.next = 11;
          break;

        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](3);
          _didIteratorError2 = true;
          _iteratorError2 = _context.t0;

        case 11:
          _context.prev = 11;
          _context.prev = 12;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 14:
          _context.prev = 14;

          if (!_didIteratorError2) {
            _context.next = 17;
            break;
          }

          throw _iteratorError2;

        case 17:
          return _context.finish(14);

        case 18:
          return _context.finish(11);

        case 19:
          _iteratorNormalCompletion3 = true;
          _didIteratorError3 = false;
          _iteratorError3 = undefined;
          _context.prev = 22;

          for (_iterator3 = document.querySelectorAll('.tb-edit')[Symbol.iterator](); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            _b = _step3.value;

            _b.addEventListener('click', tbEditClick);
          }

          _context.next = 30;
          break;

        case 26:
          _context.prev = 26;
          _context.t1 = _context["catch"](22);
          _didIteratorError3 = true;
          _iteratorError3 = _context.t1;

        case 30:
          _context.prev = 30;
          _context.prev = 31;

          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }

        case 33:
          _context.prev = 33;

          if (!_didIteratorError3) {
            _context.next = 36;
            break;
          }

          throw _iteratorError3;

        case 36:
          return _context.finish(33);

        case 37:
          return _context.finish(30);

        case 38:
          _iteratorNormalCompletion4 = true;
          _didIteratorError4 = false;
          _iteratorError4 = undefined;
          _context.prev = 41;

          for (_iterator4 = document.querySelectorAll('.tb-download')[Symbol.iterator](); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            _b2 = _step4.value;

            _b2.addEventListener('click', tbDownloadClick);
          }

          _context.next = 49;
          break;

        case 45:
          _context.prev = 45;
          _context.t2 = _context["catch"](41);
          _didIteratorError4 = true;
          _iteratorError4 = _context.t2;

        case 49:
          _context.prev = 49;
          _context.prev = 50;

          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }

        case 52:
          _context.prev = 52;

          if (!_didIteratorError4) {
            _context.next = 55;
            break;
          }

          throw _iteratorError4;

        case 55:
          return _context.finish(52);

        case 56:
          return _context.finish(49);

        case 57:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 7, 11, 19], [12,, 14, 18], [22, 26, 30, 38], [31,, 33, 37], [41, 45, 49, 57], [50,, 52, 56]]);
}

function tbDelClick(e) {
  if (!confirm('Are you sure you want to delete?')) {
    return;
  }

  var div = e.target.closest('div');
  var picId = div.getAttribute('picId'); // console.log(picId);

  fetch("/api/picture", {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json'
    },
    body: "{\"id\": \"".concat(picId, "\"}")
  }).then(function (r) {
    return r.json();
  }).then(function (j) {
    // в ответе сервера должно быть поле result, в нем (affectedRows)
    // если 1 - было удаление, 0 - не было
    if (typeof j.result == 'undefined') {
      alert("Some error");
    } else if (j.result == 1) {
      alert("Delete completed!"); // удалить div из контейнера картинок

      div.remove();
    } else {
      alert("Deleted failed");
    }
  });
}

function tbEditClick(e) {
  var div = e.target.closest('div');
  var picId = div.getAttribute('picId');
  console.log(picId);
  var place = div.querySelector('i > span');

  if (!place) {
    throw "EditClick: place(<i>) not found";
  }

  var description = div.querySelector('p > span');

  if (!description) {
    throw "EditClick: description(<p>) not found";
  } // toggle effect


  if (typeof div.savedPlace == 'undefined') {
    // first click
    div.savedPlace = place.innerHTML;
    div.savedDescription = description.innerHTML;
    div.querySelector('.tb-edit').className = 'tb-save'; // editable content

    place.setAttribute('contenteditable', 'true');
    description.setAttribute('contenteditable', 'true');
    description.focus();
    console.log(div.savedPlace, div.savedDescription);
  } else {
    // second click
    // no changes - no fetch
    // one field changed - one field fetched
    var data = {};

    if (div.savedPlace != place.innerHTML) {
      data.place = place.innerHTML;
    }

    if (div.savedDescription != description.innerHTML) {
      data.description = description.innerHTML;
    }

    var savedPlace = div.savedPlace;
    var savedDescription = div.savedDescription;

    if (Object.keys(data).length > 0) {
      data.id = picId;
      fetch("/api/picture", {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.text();
      }).then(function (res) {
        var data = JSON.parse(res);
        console.log(res);
      })["catch"](function (err) {
        alert("error");
        description.innerHTML = savedDescription;
        place.innerHTML = savedPlace;
      });
    }

    delete div.savedPlace;
    delete div.savedDescription;
    place.removeAttribute('contenteditable');
    description.removeAttribute('contenteditable');
    div.querySelector('.tb-save').className = 'tb-edit';
  }
}

document.addEventListener('keydown', function (e) {
  if (event.code == 'Escape') {
    var div = document.querySelector('#gallery-container');
    var saveBtns = div.querySelectorAll('.tb-save');
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = saveBtns[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var prop = _step5.value;
        prop.className = 'tb-edit';
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
          _iterator5["return"]();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    var fields = div.querySelectorAll('p > span, i > span');
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = fields[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var _prop = _step6.value;

        _prop.removeAttribute('contenteditable');
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
          _iterator6["return"]();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }
  }
});

function tbDownloadClick(e) {
  var div = e.target.closest('div');
  var picId = div.getAttribute('picId');
  console.log(picId);
  window.location = "/download?picId=" + picId;
}

function authUser(txt) {
  var userLogin;
  return regeneratorRuntime.async(function authUser$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!(txt == "0")) {
            _context2.next = 4;
            break;
          }

          alert("Authorization declined");
          _context2.next = 9;
          break;

        case 4:
          userLogin = document.querySelector('input[type=text]');

          if (userLogin) {
            _context2.next = 7;
            break;
          }

          throw "User login not found";

        case 7:
          setCookie("login", userLogin.value, {
            'max-age': 7200
          });
          loadAuthContainer();

        case 9:
          console.log(txt);

        case 10:
        case "end":
          return _context2.stop();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", loadAuthContainer);

function setCookie(name, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  options = _objectSpread({
    path: '/'
  }, options);

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (var optionKey in options) {
    updatedCookie += "; " + optionKey;
    var optionValue = options[optionKey];

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
} // возвращает куки с указанным name,
// или undefined, если ничего не найдено


function getCookie(name) {
  var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function authControls() {
  var userBlock, logBtn;
  return regeneratorRuntime.async(function authControls$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          // user-block - auth
          userBlock = document.querySelector('#user-block');

          if (userBlock) {
            _context3.next = 3;
            break;
          }

          throw "userBlock not found";

        case 3:
          // button click 
          logBtn = userBlock.querySelector('input[type=button]');

          if (logBtn) {
            _context3.next = 6;
            break;
          }

          throw "logIn button not found";

        case 6:
          logBtn.addEventListener('click', function () {
            if (document.cookie.indexOf('user-id') !== -1) {
              deleteCookie('user-id');
              loadAuthContainer();
              return;
            }

            var userLogin = userBlock.querySelector('input[type=text]');

            if (!userLogin) {
              throw "User login not found";
            }

            var userPassword = userBlock.querySelector('input[type=password]');

            if (!userPassword) {
              throw "User password not found";
            } // validation


            if (userLogin.value.length == 0) {
              alert("Login cannot be empty");
              return;
            }

            if (userPassword.value.length == 0) {
              alert("Password cannot be empty");
              return;
            }

            fetch("/api/user?userLogin=".concat(userLogin.value, "&userPassword=").concat(userPassword.value)).then(function (r) {
              return r.text();
            }).then(authUser); // console.log(userLogin.value, userPassword.value);
          });

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function loadAuthContainer() {
  var cont;
  return regeneratorRuntime.async(function loadAuthContainer$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          cont = document.querySelector("#auth_container");

          if (cont) {
            _context4.next = 3;
            break;
          }

          throw "auth_container not found";

        case 3:
          fetch('/templates/auth1.tpl').then(function (r) {
            return r.text();
          }).then(function (tpl) {
            cont.innerHTML = tpl.replace("{{login}}", getCookie('login'));
            authControls();
          });

        case 4:
        case "end":
          return _context4.stop();
      }
    }
  });
}