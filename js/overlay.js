(function() {
  this.Overlay = function () {

    this.videoBox = null; /* Le container de la vidéo et des overlays */
    this.video = null; /* La balise video */

    this.overlay = null; /* Les overlays */
    this.form = false; /* le formulaire du quiz */
    this.button = false; /* le button submit du formulaire du quiz */
    this.sended = false; /* Est ce que le formulaire a été soumis */
    this.callback = false;
    this.validation = false;
    this.audios = []; /* fichiers audio preloadés */
    this.events = []; /* Les evennement à enchainer apres la réponse */

    var defaults = {
      overlays: [],
      autoplay: false,
      fullscreen: false,
      active: 'active',
    }

    if (arguments[0] && typeof arguments[0] === "object") {
      this.options = Object.assign({}, defaults, arguments[0]);
    }

    this.videoBox = document.querySelector(this.options.videoBox);
    if (this.videoBox) {
      this.video = this.videoBox.querySelector('video');
      // this.form = this.videoBox.querySelector('form');
      // this.button = (this.form)?this.form.querySelector('button[type=submit]'):false;
      // this.overlay = this.videoBox.querySelector(this.options.overlay);
    }
    // if (this.videoBox && this.video && this.overlay) {
    if (this.videoBox && this.video) {
      initializeEvents.call(this);
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

  var initializeEvents =  function () {
    this.video.addEventListener('timeupdate', checkTime.bind(this));
    this.videoBox.addEventListener('click', playPause.bind(this));
    this.videoBox.addEventListener('newevents', addEvents.bind(this));
    this.videoBox.addEventListener('startevent', startEvent.bind(this));
    this.videoBox.addEventListener('stopevent', stopEvent.bind(this));
  }

  var initializeAudio = function (audios) {
    if (audios && audios.length>0) {
      var l = audios.length;
      for (var i=0;i<l;i++) {
        this.audios.push(new Audio(audios[i]));
        this.audios[i].load();
      }
    }
  }

  var checkTime = function () {
    var time = this.video.currentTime;
    console.log(this.overlay);
    this.options.overlays.forEach(function (overlay, index) {
      if (overlay.active==undefined) {
        overlay.active = false;
      }
      if (overlay.sended === undefined) {
        overlay.sended = false;
      }
      overlay.layerElement = this.videoBox.querySelector(overlay.layer);
      if (!overlay.sended && ((time+0.5) > overlay.stop)) {
        this.video.currentTime = overlay.start;
      }
      if ( ((time < overlay.start) || (time > overlay.stop)) && overlay.active===true) {
        this.form.removeEventListener('submit', submitForm.bind(this));
        this.overlay = false;
        this.form = false;
        this.button = false;
        this.callback = false;
        this.validation = false;
        this.audios = [];
        overlay.layerElement.classList.remove(this.options.active);
        overlay.active = false;
      }
      if ( (time > overlay.start) && (time < overlay.stop) && overlay.active===false ) {
        this.overlay = this.options.overlays[index];
        this.form = overlay.layerElement.querySelector('form');
        this.button = this.form.querySelector('button[type=submit]');
        this.callback = overlay.callback;
        this.validation = overlay.validation;
        initializeAudio.call(this, overlay.audios);
        if (this.form) {
          this.form.addEventListener('submit', submitForm.bind(this));
          if (this.validation) {
            var inputs = this.form.querySelectorAll('input');
            for (var i = 0; i < inputs.length; i++) {
              console.log('input', i);
              inputs[i].addEventListener('change', validateForm.bind(this));
            }
          }
        }
        validateForm.call(this,this.form);
        overlay.active = true;
        overlay.layerElement.classList.add(this.options.active);
      }
    }, this);

  }

  var submitForm = function (e) {
    e.preventDefault();
    console.log(e);
    this.button.disabled = true;
    if (this.callback) {
      var formData = extract(this.form);
      var result = this.callback(formData);
      if (result !== false) {
        this.overlay.sended = true;
        var newevents = new CustomEvent('newevents', {detail:{result: result}});
        this.videoBox.dispatchEvent(newevents);
      }
    } else {
      this.sended = true;
    }
  } 

  var validateForm = function (e) {
    var isOk = this.validation(extract(this.form));
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
        console.log(audio);
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



