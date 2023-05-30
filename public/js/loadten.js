const blogStream = document.querySelector(".blog_stream");
const blogCardTemplate = `<div class = "blog_card">
<h1><a target = "_top"href = "/post/{{ post.posts }}">{{ post.title }} </a></h1>
<p><i><span data-timestamp = "{{ post.timestamp }}" class = "timestamp"></span></i>
<p>{{ post.des }}</p>
</div>`

let lastEvaluatedKey = null;
let isFetching = false;
const loadItems = () => {
  if(isFetching){ return; }
  isFetching = true;
  fetch("/items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lastEvaluatedKey }),
  })
    .then((response) => response.json())
    .then((data) => {
      lastEvaluatedKey = data.lastEvaluatedKey;
      const html = data.items.map((item) => {
        return blogCardTemplate
          .replace("{{ post.title }}", item.title)
          .replace("{{ post.des }}", item.des)
          .replace("{{ post.timestamp }}", item.timestamp)
          .replace("{{ post.posts }}",item.posts);
      });
      
      blogStream.innerHTML += html.join("");
      var toModify = document.querySelectorAll('.timestamp');
      toModify.forEach((element)=>{
        var timestamp = element.getAttribute('data-timestamp');
        element.innerHTML = displayTimeAgo(parseInt(timestamp))
        
      })
      isFetching = false;
    });
};

loadItems();
window.addEventListener("scroll",(e)=>{
  if (
    window.innerHeight + window.scrollY+10 >= document.body.offsetHeight &&
    lastEvaluatedKey
  ) {
    loadItems();
  }
});
function displayTimeAgo(timestamp) {
  var currentTime = new Date().getTime();
  var timeDiff = currentTime - timestamp;
  var oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  var oneYear = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds

  if (timeDiff < oneWeek) {
    // time difference is less than one week
    return Math.round(timeDiff / (24 * 60 * 60 * 1000)) + " days ago";
  } else if (timeDiff < oneYear) {
    // time difference is less than one year
    var date = new Date(timestamp);
    var month = date.toLocaleString('default', { month: 'long' });
    var day = date.getDate();
    return month + " " + day;
  } else {
    // time difference is more than one year
    var date = new Date(timestamp);
    var month = date.toLocaleString('default', { month: 'long' });
    var day = date.getDate();
    var year = date.getFullYear();
    return month + " " + day + ", " + year;
  }
}