document.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const descr = form.querySelector('input[name=description]');
    if (!descr) {
        throw "Data transfer error: input[name=description] not found.";
    }
    const place = form.querySelector('input[name=place]');
    if (!place) {
        throw "Data transfer error: input[name=place] not found.";
    }
    // TODO: data validation 

    const formData = new FormData();
    formData.append("input[name=description]", descr.value);
    formData.append("input[name=place]", place.value);

    fetch("/", {
        method: "GET", 
        data: formData
    }).then(r => r.text()).then(console.log);
});