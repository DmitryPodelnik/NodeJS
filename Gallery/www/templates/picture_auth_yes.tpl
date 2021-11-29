<div class="picture-item" picId="{{id}}">
    <div class="vote">
        <div class="vote-like">&#8593;</div>
        <div class="vote-total">{{rating}}</div>
        <div class="vote-dislike">&#8595;</div>
    </div>
    <img src="/pictures/{{filename}}" />
    <div>Title: <b>{{title}}</b></div>
    <div>Description: <p>{{description}}</p></div>
    <div>Place: <i>{{place}}</i></div>
    <section class="tool-buttons">
        <span class="tb-delete"></span>
        <span class="tb-edit"></span>
        <span class="tb-download"></span>
    </section>
    <div class="picture-comments"></div>
    <br />
    <form>
        <label><span>Комментарий: </span><input type="text" name="comment" class="picture-new-comment" /></label>
        <button class="add-comment">Отправить</button>
    </form>
</div>