(function() {
  this.Overlay = function () {
    this.video = null; /* La balise video */
    this.videoBox = null; /* Le container de la vidéo et des overlays */
    this.overlay = null; /* Les overlays */
    this.form = null;
    this.sended = false; /* Est ce que le formulaire a été soumis */

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
    this.videoBox = document.querySelector(this.options.videoBox);
    if (this.videoBox) {
      this.video = this.videoBox.querySelector('video');
      this.form = this.videoBox.querySelector('form');
      this.overlay = this.videoBox.querySelector(this.options.overlay);
    }
    if (this.videoBox && this.video && this.overlay) {
      this.init();
      if (this.options.autoplay) {
        this.playVideo();
      }
    }
  }

  Overlay.prototype.playVideo = function () {
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
    if (this.sended) {
      return;
    }
    var time = this.video.currentTime;
    if ( ((time+0.5) > this.options.stop)) {
      this.video.currentTime = this.options.start;
    }
    if ( (time < this.options.start) || (time > this.options.stop) ) {
      this.overlay.classList.remove(this.options.active);
    }
    if ( (time > this.options.start) && (time < this.options.stop) ) {
      this.overlay.classList.add(this.options.active);
    }
  }

  var requestFullscreen = function (elem) {
    var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
      (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
      (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
      (document.msFullscreenElement && document.msFullscreenElement !== null);

    if (!isInFullScreen) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullScreen) {
        elem.webkitRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  var submitForm = function (e) {
    e.preventDefault();
    if (this.options.callback) {
      var formData = extract(this.form);
      if (this.options.callback(formData)) {
        this.sended = true;
        this.video.currentTime = this.options.stop;
      }
    }
  } 

  var playPause = function(e) {
    if (e.target.nodeName === 'VIDEO') {
      if (this.options.fullscreen) {
        requestFullscreen(this.videoBox);
      }
      if (this.video.paused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    }
  }

  function initializeEvents() {
    this.video.addEventListener('timeupdate', this.checkTime.bind(this));
    this.videoBox.addEventListener('click', playPause.bind(this));
    if (this.form) {
      this.form.addEventListener('submit', submitForm.bind(this));
    }
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



