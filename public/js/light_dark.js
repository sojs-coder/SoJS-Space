var sheets = document.styleSheets;
var checkbox = document.getElementById("light_dark_check");
var sheets = document.querySelectorAll('link[rel="stylesheet"]');
var frames = document.querySelectorAll('iframe');

for(var i = 0; i < sheets.length; i++){
  if(sheets[i].href == window.origin + "/css/styles_light.css"){
    checkbox.checked = false;
  }else if(sheets[i].href == window.origin + "/css/styles_dark.css"){
    checkbox.checked = true;
  }
}
if(localStorage.getItem("light") == "true"){
  checkbox.checked = false
}else if(localStorage.getItem("light") == "false"){
  checkbox.checked = true;
}
if(checkbox.checked){
  for(var i = 0; i < sheets.length; i++){
    if(sheets[i].href == window.origin + "/css/styles_light.css"){
      sheets[i].href = window.origin + "/css/styles_dark.css";
    }
    if(sheets[i].href == window.origin + "/css/nav_light.css"){
      sheets[i].href = window.origin + "/css/nav_dark.css";
    }
  }
  frames.forEach(elem=>{
  elem.contentDocument.location.reload(true);
})
}else{
  for(var i = 0; i < sheets.length; i++){
    if(sheets[i].href == window.origin + "/css/styles_dark.css"){
      sheets[i].href = window.origin + "/css/styles_light.css"
    }
    if(sheets[i].href == window.origin + "/css/nav_dark.css"){
      sheets[i].href = window.origin + "/css/nav_light.css"
    }
  }
  frames.forEach(elem=>{
  elem.contentDocument.location.reload(true);
})
}
checkbox.addEventListener("change",(e)=>{
  var localCheck = e.target;
  
  if(localCheck.checked){
    localStorage.setItem("light","false");
    for(var i = 0; i < sheets.length; i++){
      if(sheets[i].href == window.origin + "/css/styles_light.css"){
        sheets[i].href = window.origin + "/css/styles_dark.css";
      }
      if(sheets[i].href == window.origin + "/css/nav_light.css"){
        sheets[i].href = window.origin + "/css/nav_dark.css";
      }
    }
  }else{
    localStorage.setItem("light","true");
    for(var i = 0; i < sheets.length; i++){
      if(sheets[i].href == window.origin + "/css/styles_dark.css"){
        sheets[i].href = window.origin + "/css/styles_light.css"
      }
      if(sheets[i].href == window.origin + "/css/nav_dark.css"){
        sheets[i].href = window.origin + "/css/nav_light.css"
      }
    }
  }
  frames.forEach(elem=>{
  elem.contentDocument.location.reload(true);
})
})