var toModify = document.querySelectorAll('.timestamp');
toModify.forEach((element)=>{
  var timestamp = element.getAttribute('data-timestamp');
  var post_time = new Date(parseInt(timestamp));
  var year = post_time.getFullYear();
  var month = post_time.getMonth();
  var day = post_time.getDate();
  
  var current_time = new Date();
  
  if(year == current_time.getFullYear() && month == current_time.getMonth() && day == current_time.getDate()){
    element.innerHTML = "Today";
  }else{
    element.innerHTML = (month+1)+"."+day+"."+year;
  }
})