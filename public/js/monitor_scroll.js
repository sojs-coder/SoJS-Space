window.onscroll = () => {
  var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

  if (scrollTop >= 20) {
    var x = document.getElementById("header");
    x.className = "shadow";
  } else {
    var x = document.getElementById("header");
    x.className = ""
  }
  if (document.getElementById("arrow_bounce")) {
    var halfheight = window.innerHeight / 3;
    if (scrollTop > halfheight) {
      document.getElementById("arrow_bounce").style.opacity = 0;
    } else{
      document.getElementById("arrow_bounce").style.opacity = 1;
    }
  }
}
function enableBodyScroll() {
  if (document.readyState === 'complete') {
    document.body.style.position = '';
    document.body.style.overflowY = '';

    if (document.body.style.marginTop) {
      const scrollTop = -parseInt(document.body.style.marginTop, 10);
      document.body.style.marginTop = '';
      window.scrollTo(window.pageXOffset, scrollTop);
    }
  } else {
    window.addEventListener('load', enableBodyScroll);
  }
}

function disableBodyScroll({ savePosition = false } = {}) {
  if (document.readyState === 'complete') {
    if (document.body.scrollHeight > window.innerHeight) {
      if (savePosition) document.body.style.marginTop = `-${window.pageYOffset}px`;
      document.body.style.position = 'fixed';
      document.body.style.overflowY = 'scroll';
    }
  } else {
    window.addEventListener('load', () => disableBodyScroll({ savePosition }));
  }
}