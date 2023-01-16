var conv = new showdown.Converter({
  simplifiedAutoLink: true,
  tables: true


})
function save() {
  var contents = document.getElementById("editor").value;
  contents = conv.makeHtml(contents);
  var description = document.getElementById("description").value;
  var pub = document.getElementById("pub").checked;
  var title = document.getElementById("title").value;
  var author = document.getElementById("author").value;
  var under = document.getElementById("under").value;

  $("#save").innerHTML = "Saving...";
  $("#save").disabled = "true";
  postData('/post', { title: title, author: author, content: contents, des: description, under: under, published: pub }).then((data) => {
    console.log(data); // JSON data parsed by `data.json()` call
    $("#save").innerHTML = "Saved!";

    window.location.replace("/post/" + title.split(" ").join("_"));
  });
}

document.getElementById("save").addEventListener('click', save)