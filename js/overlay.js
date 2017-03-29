(function() {
  this.Overlay = function () {
    this.element = null;
    this.video = null;
    this.form = null;

    var defaults = {
      start: 0,
      stop: false,
      autoplay: false,
      active: 'active',
      callback: null
    }

    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = Object.assign({}, defaults, arguments[0]);
    }
    if (this.options.videoBox) {
      this.video = this.options.videoBox.querySelector('video');
    }
    this.form = this.options.videoBox.querySelector('form');
    this.element = this.options.videoBox.querySelector(this.options.element);
    this.init();

    if (this.options.autoplay) {
      this.playVideo();
    }
  }

  Overlay.prototype.playVideo = function () {
    alert(1);
    if (this.options.fullscreen) {
      requestFullscreen(this.options.videoBox);
    }
    this.video.play()
  }  


  Overlay.prototype.init = function () {
    var theend = this; /* Because 'this is theend' */
    initializeEvents.call(this);
  }

  Overlay.prototype.checkTime = function () {
    var time = this.video.currentTime;
    if ( ((time+0.5) > this.options.stop)) {
      this.video.currentTime = this.options.start;
    }
    if ( (time < this.options.start) || (time > this.options.stop) ) {
      this.element.classList.remove(this.options.active);
    }
    if ( (time > this.options.start) && (time < this.options.stop) ) {
      this.element.classList.add(this.options.active);
    }
  }

/*
 $('.fullScreenBTn.poster').on('click', function () {
            var elem = document.getElementById($(this).data('id'));
            if (!document.fullscreenElement &&    // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                    // elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                } else {
                    $('.fullScreenBTn').removeClass('poster');
                    //console.log('Echec load fullscreen...');
                }
                setTimeout(function () {
                    elem.play();
                }, 1050);
            }
        });
*/

  var requestFullscreen = function (elem) {
    console.log(elem);
      if (!document.fullscreenElement &&    // alternative standard method
          !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
          if (elem.requestFullscreen) {
              elem.requestFullscreen();
          } else if (elem.msRequestFullscreen) {
              elem.msRequestFullscreen();
          } else if (elem.mozRequestFullScreen) {
              elem.mozRequestFullScreen();
          } else if (elem.webkitRequestFullscreen) {
              elem.webkitRequestFullscreen();
              // elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
          } else {
              //console.log('Echec load fullscreen...');
          }
      }
  }

  var submitForm = function (e) {
    var formData = extract(this.form);
    e.preventDefault();
    if (this.options.callback) {
      this.options.callback(formData);
    }
  } 

  function initializeEvents() {
    if (this.video) {
      this.video.addEventListener('timeupdate', this.checkTime.bind(this));
    }
    if (this.form) {
      console.log('eventRegister');
      this.form.addEventListener('submit', submitForm.bind(this));
    }
  }

  var serialize = function (form) {
    if (!form || form.nodeName !== "FORM") {
        return;
    }
    return extract(form).join("&");
  }
  
  var extract = function (form) {
    if (!form || form.nodeName !== "FORM") {
        return;
    }
    var i, j = [];
    var q = {};
    for (i = form.elements.length - 1; i >= 0; i = i - 1) {
        if (form.elements[i].name === "") {
            continue;
        }
        switch (form.elements[i].nodeName) {
        case 'INPUT':
            switch (form.elements[i].type) {
            case 'text':
            case 'hidden':
            case 'password':
            case 'button':
            case 'reset':
            case 'submit':
                q[form.elements[i].name] = form.elements[i].value;
                break;
            case 'checkbox':
            case 'radio':
                if (form.elements[i].checked) {
                    q[form.elements[i].name] = form.elements[i].value;
                }                                               
                break;
            }
            break;
            case 'file':
            break; 
        case 'TEXTAREA':
            q[form.elements[i].name] = form.elements[i].value;
            break;
        case 'SELECT':
            switch (form.elements[i].type) {
            case 'select-one':
                q[form.elements[i].name] = form.elements[i].value;
                break;
            case 'select-multiple':
                for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
                    if (form.elements[i].options[j].selected) {
                        q[form.elements[i].name] = form.elements[i].options[j].value;
                    }
                }
                break;
            }
            break;
        case 'BUTTON':
            switch (form.elements[i].type) {
            case 'reset':
            case 'submit':
            case 'button':
                q[form.elements[i].name] = form.elements[i].value;
                break;
            }
            break;
        }
    }
    return q;
  }

}());



