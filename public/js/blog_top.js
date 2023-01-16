document.querySelectorAll('.stream-links').forEach(elem=>{
  elem.addEventListener('click',(e)=>{
    navigate(e.target.getAttribute('data-frame-point'))
  })
})
function navigate(link) {
  var contentToLoad = document.querySelector(`.streamer[data-source="${link}"]`).innerHTML;
  document.querySelector('.display-stream').innerHTML = contentToLoad;
  document.querySelector('.display-stream').setAttribute('data-current-in',link);
  document.querySelectorAll('.stream-links').forEach(elem=>{
    if(elem.getAttribute('data-frame-point') == link){
      elem.parentNode.classList.add('active');
    }else{
      elem.parentNode.classList.remove('active')
    }
  })
}
