    <div id="user-block" class="user-block user-block-auth" user-id="{{id_str}}">
        <img src="{{image-source}}" width="100" height="100" alt="avatar" />
        Hello, <b>{{login}}!</b>
        <i>({{email}})</i> 
        <input type="button" value="Log out" />
        <select id="filter-shown">
            <option value="0">All</option>
            <option value="1">Own</option>
            <option value="2">Except own</option>
        </select>    
    </div>
    <form class="add-image-form">
        <cite>Добавить изображение</cite>
        <label><span>Название: </span><input type="text" name="title"        /></label>
        <label><span>Описание: </span><input type="text" name="description"  /></label>
        <label><span>Место:    </span><input type="text" name="place"        /></label>
        <label><span>Файл:     </span><input type="file" name="picture"      /></label>
        <button>Загрузить</button>
    </form>