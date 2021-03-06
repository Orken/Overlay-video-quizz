(function() {
  this.Overlay = function () {
    this.video = null; /* La balise video */
    this.videoBox = null; /* Le container de la vidéo et des overlays */
    this.overlay = null; /* Les overlays */
    this.form = null; /* le formulaire du quiz */
    this.button = null; /* le button submit du formulaire du quiz */
    this.sended = false; /* Est ce que le formulaire a été soumis */
    this.audios = []; /* fichiers audio preloadés */
    this.events = []; /* Les evennement à enchainer apres la réponse */

    var defaults = {
      start: 0,
      stop: false,
      autoplay: false,
      active: 'active',
      callback: null,
      validation: null
    }

    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = Object.assign({}, defaults, arguments[0]);
    }

    var initializeEvents =  function () {
      this.video.addEventListener('timeupdate', checkTime.bind(this));
      this.videoBox.addEventListener('click', playPause.bind(this));
      if (this.form) {
        this.form.addEventListener('submit', submitForm.bind(this));

        if (this.options.validation) {
          var inputs = this.form.querySelectorAll('input');
          for (var i = 0; i < inputs.length; i++) {
              inputs[i].addEventListener('change', validateForm.bind(this));
          }
        }
      }
      this.videoBox.addEventListener('newevents', addEvents.bind(this));
      this.videoBox.addEventListener('startevent', startEvent.bind(this));
      this.videoBox.addEventListener('stopevent', stopEvent.bind(this));
    }


    this.videoBox = document.querySelector(this.options.videoBox);
    if (this.videoBox) {
      this.video = this.videoBox.querySelector('video');
      this.form = this.videoBox.querySelector('form');
      this.button = (this.form)?this.form.querySelector('button[type=submit]'):false;
      this.overlay = this.videoBox.querySelector(this.options.overlay);
    }
    if (this.options.validation) {
      validateForm.call(this,this.form);
    }
    if (this.videoBox && this.video && this.overlay) {
      initializeEvents.call(this);
      if (this.options.audios && this.options.audios.length>0) {
        var l = this.options.audios.length;
        for (var i=0;i<l;i++) {
          this.audios.push(new Audio(this.options.audios[i]));
          this.audios[i].load();
        }
      }
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

  Overlay.prototype.playAudio = function (id) {
    this.audios[id].currentTime = 0;
    this.audios[id].play();
  }

  Overlay.prototype.init = function () {
    initializeEvents.call(this);
  }

  var checkTime = function () {
    var time = this.video.currentTime;
    if (!this.sended && ((time+0.5) > this.options.stop)) {
      this.video.currentTime = this.options.start;
    }
    if ( (time < this.options.start) || (time > this.options.stop) ) {
      this.overlay.classList.remove(this.options.active);
    }
    if ( (time > this.options.start) && (time < this.options.stop) ) {
      this.overlay.classList.add(this.options.active);
    }
  }

  var submitForm = function (e) {
    e.preventDefault();
    this.button.disabled = true;
    if (this.options.callback) {
      var formData = extract(this.form);
      var result = this.options.callback(formData);
      if (result !== false) {
        this.sended = true;
        var newevents = new CustomEvent('newevents', {detail:{result: result}});
        this.videoBox.dispatchEvent(newevents);
      }
    }
  } 

  var validateForm = function (e) {
    var isOk = this.options.validation(extract(this.form));
    if (this.button) {
      this.button.disabled = !isOk;
    }
    return isOk;
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

  var dispatchStartEvent = function (event) {
    var newevent = new CustomEvent('startevent', {detail: {
      event: event
    }});
    this.videoBox.dispatchEvent(newevent);
  }

  var dispatchStopEvent = function () {
    var newevent = new CustomEvent('stopevent',{detail : {}});
    this.videoBox.dispatchEvent(newevent);
  }

  var addEvents = function (e, r) {
    this.events = e.detail.result;
    var event = this.events.shift();
    dispatchStartEvent.call(this,event);
  }

  var startEvent = function (e, r) {
    switch (e.detail.event.action) {
      case 'pauseVideo':
        this.video.pause();
        dispatchStopEvent.call(this);
        break;
      case 'playAudio':
        var that = this;
        var audio = this.audios[e.detail.event.id];
        var nextEvent = function (e) {
          dispatchStopEvent.call(that);
          audio.removeEventListener('ended', nextEvent);
        }
        var audioevent = audio.addEventListener('ended', nextEvent);
        this.audios[e.detail.event.id].play();
        break;
      case 'jumpTo':
        this.video.currentTime = e.detail.event.time;
        dispatchStopEvent.call(this);
        break;        
      case 'playVideo':
        this.video.play();
        dispatchStopEvent.call(this);
        break;
    }
  }
  
  var stopEvent = function (e, r) {
    if (this.events.length>0) {
      var event = this.events.shift();
      dispatchStartEvent.call(this, event);
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



