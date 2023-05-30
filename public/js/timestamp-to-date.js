createTimestamps=()=>{
  var toModify = document.querySelectorAll('.timestamp');
  toModify.forEach((element)=>{
    var timestamp = element.getAttribute('data-timestamp');
    element.innerHTML = displayTimeAgo(parseInt(timestamp))
    
  })
}
createTimestamps();
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
