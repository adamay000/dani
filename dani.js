;(function __scope(global) {

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}

function clamp01(value) {
  return Math.max(Math.min(value, 1), 0);
}

function lerp(min, max, weight) {
  return min * (1 - weight) + max * weight;
}

function inverseLerp(min, max, value) {
  if (min === max) {
    return min;
  }
  return clamp01((value - min) / (max - min));
}

function Loop(options) {
  options = typeof options === 'object' ? options : {};
  this.suppressWarning = Boolean(options.suppressWarning);

  this.__local = {
    isRunning: false,
    autoStart: true,
    callbacks: {},
    callbackOrder: [],
    id: 0,
    requestID: null,
    lastTime: 0
  };

  this.__loop = this.__loop.bind(this);
}
Loop.DEFAULT_NAMESPACE = '$$default';
Loop.prototype.on = function on(namespace, priority, callback) {
  if (typeof priority === 'function') {
    callback = priority;
    if (typeof namespace === 'string') {
      priority = 0;
    } else {
      priority = namespace;
      namespace = Loop.DEFAULT_NAMESPACE;
    }
  } else if (typeof namespace === 'function') {
    callback = namespace;
    priority = 0;
    namespace = Loop.DEFAULT_NAMESPACE;
  }

  if (!this.__local.callbacks[namespace]) {
    this.__local.callbacks[namespace] = [];
  }

  var data = {
    namespace: namespace,
    priority: priority,
    id: this.__local.id,
    callback: callback,
    frame: 0,
    elapsedTime: 0
  };
  this.__local.id += 1;
  this.__local.callbacks[namespace].push(data);
  this.__local.callbackOrder.push(data);
  this.__local.callbackOrder.sort(this.__sort);

  if (!this.__local.isRunning && this.__local.autoStart) {
    this.start();
  }

  return this;
};
Loop.prototype.off = function off(namespace, callback) {
  callback = typeof namespace === 'string' ? callback : namespace;
  namespace = typeof namespace === 'string' ? namespace : Loop.DEFAULT_NAMESPACE;

  if (!this.__local.callbacks[namespace] && !this.suppressWarning) {
    console.warn('Loop.off(): namespace \'' + namespace + '\' has no callbacks.');
    return this;
  }

  var i, j;
  if (typeof callback !== 'function') {
    for (i = 0; i < this.__local.callbacks[namespace].length; i += 1) {
      j = this.__local.callbackOrder.indexOf(this.__local.callbacks[namespace][i]);
      if (j !== -1) {
        this.__local.callbackOrder.splice(j, 1);
      }
    }
    delete this.__local.callbacks[namespace];
  } else {
    var removed;
    for (i = this.__local.callbacks[namespace].length - 1; i >= 0; i -= 1) {
      if (this.__local.callbacks[namespace][i].callback === callback) {
        removed = this.__local.callbacks[namespace].splice(i, 1)[0];
        j = this.__local.callbackOrder.indexOf(removed);
        if (j !== -1) {
          this.__local.callbackOrder.splice(j, 1);
        }
      }
    }

    if (this.__local.callbacks[namespace].length === 0) {
      delete this.__local.callbacks[namespace];
    }
  }

  if (Object.keys(this.__local.callbacks).length === 0) {
    this.__stop();
  }

  return this;
};
Loop.prototype.start = function start() {
  this.__local.autoStart = true;
  if (this.__local.isRunning) {
    return this;
  }
  this.__local.isRunning = true;

  this.__local.lastTime = Date.now();

  this.__local.requestID = requestAnimationFrame(this.__loop);

  return this;
};
Loop.prototype.stop = function stop() {
  this.__local.autoStart = false;
  return this.__stop();
};
Loop.prototype.__stop = function __stop() {
  if (!this.__local.isRunning) {
    return this;
  }
  this.__local.isRunning = false;

  cancelAnimationFrame(this.__local.requestID);

  return this;
};
Loop.prototype.__loop = function __loop() {
  this.__local.requestID = requestAnimationFrame(this.__loop);

  var time = Date.now();
  var deltaTime = time - this.__local.lastTime;
  this.__local.lastTime = time;

  var self = this;
  for (var i = 0; i < this.__local.callbackOrder.length; i += 1) {
    this.__local.callbackOrder[i].frame += 1;
    this.__local.callbackOrder[i].elapsedTime += deltaTime;
    var e = {
      namespace: this.__local.callbackOrder[i].namespace,
      frame: this.__local.callbackOrder[i].frame,
      elapsedTimeMS: this.__local.callbackOrder[i].elapsedTime,
      deltaTimeMS: deltaTime,
      stop: self.off.bind(self, this.__local.callbackOrder[i].namespace, this.__local.callbackOrder[i].callback)
    };
    this.__local.callbackOrder[i].callback(e);
  }
};
Loop.prototype.__sort = function __sort(a, b) {
  var priority = b.priority - a.priority;
  if (priority !== 0) {
    return priority;
  }
  return a.id - b.id;
};

var loop = new Loop();

var Easing = {
  linear: function linear(progress) { return progress; },
  easeIn: function easeInGenerator(power) {
    return function easeIn(progress) {
      return Math.pow(progress, power);
    };
  },
  easeOut: function easeOutGenerator(power) {
    return function easeOut(progress) {
      return 1 - Math.abs(Math.pow(1 - progress, power));
    };
  },
  easeInOut: function easeInOutGenerator(power) {
    return function easeInOut(progress) {
      return progress < 0.5 ? Easing.easeIn(power)(progress * 2) / 2 : Easing.easeOut(power)(progress * 2 - 1) / 2 + 0.5;
    };
  }
};
Easing.easeIn2 = Easing.easeIn(2);
Easing.easeIn3 = Easing.easeIn(3);
Easing.easeIn4 = Easing.easeIn(4);
Easing.easeIn5 = Easing.easeIn(5);
Easing.easeOut2 = Easing.easeOut(2);
Easing.easeOut3 = Easing.easeOut(3);
Easing.easeOut4 = Easing.easeOut(4);
Easing.easeOut5 = Easing.easeOut(5);
Easing.easeInOut2 = Easing.easeInOut(2);
Easing.easeInOut3 = Easing.easeInOut(3);
Easing.easeInOut4 = Easing.easeInOut(4);
Easing.easeInOut5 = Easing.easeInOut(5);

var definedEasings = {
  linear: Easing.linear,
  easeIn: Easing.easeIn2,
  easeIn2: Easing.easeIn2,
  easeIn3: Easing.easeIn3,
  easeIn4: Easing.easeIn4,
  easeIn5: Easing.easeIn5,
  easeOut: Easing.easeOut2,
  easeOut2: Easing.easeOut2,
  easeOut3: Easing.easeOut3,
  easeOut4: Easing.easeOut4,
  easeOut5: Easing.easeOut5,
  easeInOut: Easing.easeInOut2,
  easeInOut2: Easing.easeInOut2,
  easeInOut3: Easing.easeInOut3,
  easeInOut4: Easing.easeInOut4,
  easeInOut5: Easing.easeInOut5
};

function Animation(params) {
  this.duration = typeof params.duration === 'number' ? params.duration : 1000;
  if (typeof params.ease === 'string') {
    if (typeof definedEasings[params.ease] !== 'function') {
      throw new Error('{ ease: \'' + params.ease + '\' } is not defined.');
    }
    this.ease = definedEasings[params.ease];
  } else if (typeof params.ease === 'function') {
    this.ease = params.ease;
  } else {
    this.ease = Easing.linear;
  }
  this.loop = Boolean(params.loop);
  this.reverseOnLoop = Boolean(params.reverseOnLoop);
  this.skipDuplicationFrameOnLoop = Boolean(params.skipDuplicationFrameOnLoop);

  this.isRunning = false;
  this.isReverse = false;
  this.progress01 = 0;
  this.progress = 0;

  this.__local = {
    events: {
      play: [],
      reverse: [],
      pause: [],
      progress: [],
      complete: [],
      begin: [],
      reverseBegin: [],
      reverseComplete: []
    },
    isLoopCompleted: false,
    atBegin: true,
    atComplete: false
  };

  var events = this.__local.events;
  var eventNames = Object.keys(events);
  var onEventName;
  for (var i = 0; i < eventNames.length; i += 1) {
    onEventName = 'on' + eventNames[i].substr(0, 1).toUpperCase() + eventNames[i].substr(1).toLowerCase();
    if (typeof params[onEventName] === 'function') {
      events[eventNames[i]].push(params[onEventName]);
    }
  }

  this.__loop = this.__loop.bind(this);
}
Animation.DEFAULT_NAMESPACE = '$$animation';
Animation.loop = new Loop();
Animation.prototype.play = function play() {
  if (this.isRunning && !this.isReverse || this.progress01 === 1) {
    return this;
  }

  var wasRunning = this.isRunning;
  this.isRunning = true;
  this.isReverse = false;

  this.__emit('play');

  if (!wasRunning) {
    Animation.loop.on(Animation.DEFAULT_NAMESPACE, this.__loop);
  }

  return this;
};
Animation.prototype.reverse = function reverse() {
  if (this.isRunning && this.isReverse || this.progress01 === 0) {
    return this;
  }

  var wasRunning = this.isRunning;
  this.isRunning = true;
  this.isReverse = true;

  this.__emit('reverse');

  if (!wasRunning) {
    Animation.loop.on(Animation.DEFAULT_NAMESPACE, this.__loop);
  }

  return this;
};
Animation.prototype.pause = function pause() {
  if (!this.isRunning) {
    return this;
  }

  this.isRunning = false;

  Animation.loop.off(Animation.DEFAULT_NAMESPACE, this.__loop);

  this.__emit('pause');

  return this;
};
Animation.prototype.setProgress01 = function setProgress01(progress01, withoutEvent) {
  this.progress01 = clamp01(progress01);
  this.progress = this.ease(this.progress01);

  if (!withoutEvent) {
    this.__emit('progress', this.progress);
  }

  return this;
};
Animation.prototype.on = function on(eventName, callback) {
  if (this.__local.events[eventName] == null) {
    console.warn(eventName + 'does not exist.');
    return;
  }
  this.__local.events[eventName].push(callback);

  return this;
};
Animation.prototype.off = function on(eventName, callback) {
  if (this.__local.events[eventName] == null) {
    console.warn(eventName + 'does not exist.');
    return this;
  }
  if (callback == null) {
    this.__local.events[eventName] = [];
  } else {
    for (var i = this.__local.events[eventName].length - 1; i >= 0; i -= 1) {
      if (this.__local.events[eventName][i] === callback) {
        this.__local.events[eventName].splice(i, 1);
      }
    }
  }

  return this;
};
Animation.prototype.__emit = function __emit(eventName, value) {
  if (eventName !== 'progress') {
    var div = document.createElement('div');
    div.textContent = eventName + ': ' + value;
    document.body.appendChild(div);
  }
  this.__local.events[eventName].forEach(function (event) {
    event(value);
  });
};
Animation.prototype.__loop = function __loop(e) {
  if (this.__local.isLoopCompleted) {
    this.__local.isLoopCompleted = false;
    if (this.loop) {
      if (this.reverseOnLoop) {
        if (this.__local.atBegin) {
          this.play();
        } else if (this.__local.atComplete) {
          this.reverse();
        }
      } else {
        if (this.__local.atBegin) {
          if (this.skipDuplicationFrameOnLoop) {
            this.setProgress01(1, true);
            this.__local.atBegin = false;
            this.__local.atComplete = true;
          } else {
            this.__emit('reverseBegin');
            this.setProgress01(1);
            this.__local.atBegin = false;
            this.__local.atComplete = false;
            return;
          }
        } else if (this.__local.atComplete) {
          if (this.skipDuplicationFrameOnLoop) {
            this.setProgress01(0, true);
            this.__local.atBegin = true;
            this.__local.atComplete = false;
          } else {
            this.__emit('begin');
            this.setProgress01(0);
            this.__local.atBegin = false;
            this.__local.atComplete = false;
            return;
          }
        }
      }
    }
  }

  if (this.__local.atBegin && !this.isReverse) {
    this.__emit('begin');
    this.__local.atBegin = false;
  }
  if (this.__local.atComplete && this.isReverse) {
    this.__emit('reverseBegin');
    this.__local.atComplete = false;
  }

  var deltaProgress = e.deltaTimeMS / this.duration;
  if (this.isReverse) {
    deltaProgress *= -1;
  }

  this.setProgress01(this.progress01 + deltaProgress);

  if (this.progress01 === 1 && !this.isReverse) {
    this.__local.atComplete = true;
    this.__emit('complete');
    if (this.loop) {
      this.__local.isLoopCompleted = true;
    } else {
      Animation.loop.off(Animation.DEFAULT_NAMESPACE, this.__loop);
      this.isRunning = false;
    }
  } else if (this.progress01 === 0 && this.isReverse) {
    this.__local.atBegin = true;
    this.__emit('reverseComplete');
    if (this.loop) {
      this.__local.isLoopCompleted = true;
    } else {
      Animation.loop.off(Animation.DEFAULT_NAMESPACE, this.__loop);
      this.isRunning = false;
    }
  }
};

var animate = function animate(duration, ease, onProgress) {
  if (typeof onProgress !== 'function') {
    onProgress = ease;
    ease = Easing.linear;
  }
  return new Animation({
    duration: duration,
    ease: ease,
    onProgress: onProgress
  }).play();
};

function Transition(params) {
  var isOn = !Boolean(params.isOn);

  this.min = typeof params.min === 'number' ? params.min : 0;
  this.max = typeof params.max === 'number' ? params.max : 1;
  this.value = typeof params.value === 'number' ? params.value : 0;

  var self = this;
  this.__local = {
    animation: new Animation({
      duration: params.duration,
      ease: params.ease,
      onProgress: function transition(progress) {
        self.value = lerp(self.min, self.max, progress);
        params.onUpdate(self.value);
      }
    })
  };

  this.__local.animation.setProgress01(inverseLerp(this.min, this.max, this.value));

  if (isOn && this.value !== this.max) {
    this.__local.animation.play();
  } else if (!isOn && this.value !== this.min) {
    this.__local.animation.reverse();
  }
}
Transition.prototype.on = function on() {
  this.__local.animation.play();
};
Transition.prototype.off = function off() {
  this.__local.animation.reverse();
};

var exports = {
  Loop: Loop,
  Animation: Animation,
  Transition: Transition,
  Easing: Easing,
  loop: loop,
  animate: animate,
  clamp: clamp,
  clamp01: clamp01,
  lerp: lerp,
  inverseLerp: inverseLerp
};

if (typeof module !== 'undefined') {
  module.exports = exports;
} else {
  global.Dani = exports;
}

})(this);
