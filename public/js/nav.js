var currentPath = window.location.href
var blogPaths = ['/login',"/search","post"]
document.querySelectorAll('.navitem').forEach((element)=>{
  if(element.href == currentPath){
    element.classList.add('active');
  }else if(currentPath.indexOf("/login") !== -1 || currentPath.indexOf("/search") !== -1 || currentPath.indexOf("/post") !== -1){
    if(element.href == window.location.origin + "/blog" ){
      element.classList.add('active')
    }
  }
})
function expansion() {
  var x = document.getElementById("topNav");
  x.classList.toggle("expanded");
  if(window.SOJS.navEx){
    enableBodyScroll()
    window.SOJS.navEx = false;
  }else{
    disableBodyScroll({savePosition: true});
    window.SOJS.navEx = true;
  }
}