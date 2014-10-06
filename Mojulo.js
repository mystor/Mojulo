var JS_MOD = {};

JS_MOD.Anim = (function () {
  var width = 100;
  var height = 100;

  var scale = 4;
  var scaledWidth = width * scale;
  var scaledHeight = height * scale;

  var frame = 1;

  // Canvas Variables
  var ctx;   // The canvas context
  var image; // The imagedata
  var fun = function() { return 0; };   // The function entered by the user

  var fps = 10;
  var then = Date.now();
  var interval = 1000/fps;

  function init(canvas) {
    canvas.attr('width', scaledWidth);
    canvas.attr('height', scaledHeight);
    canvas.attr('image-rendering', "crisp-edges");

    // Extract the image data from the canvas
    ctx = canvas[0].getContext('2d');
    image = ctx.createImageData(width * scale, height * scale);

    run();
  }

  function updateEquation(equation) {
    fun = equation;
    then = Date.now();
    frame = 1;
  }

  function run() {
    requestAnimFrame(function() {
      run();
    });

    var now = Date.now();
    var delta = now - then;

    if (delta > interval) {
      then = now - (delta % interval);
      drawFrame(image);
      ctx.putImageData(image, 0, 0);
      frame++;
    }
  }

  function drawFrame(image) {
    var exposedFunctions = {
      sin: Math.sin,
      cos: Math.cos,
      rand: Math.random
    };

    var exposedVars = {
      x: 0,
      y: 0,
      pi: Math.PI,
      time: frame,
      r : 0,
      A : 0
    };

    for (var y = 0; y < (height); y += 1) {
      for (var x = 0; x < (width); x += 1) {
        // Ensure the correct x and y are exposed
        exposedVars.x = x;
        exposedVars.y = y;
        exposedVars.r = (Math.sqrt(  (x*x)+(y*y) ));
        exposedVars.A = (Math.atan(y/x));

        // Get the color
        var intColor = fun(exposedFunctions, exposedVars);

        for (var sy = 0; sy < scale; sy++) {
          for (var sx = 0; sx < scale; sx++) {
            image.data[(( ((y* scale)+sy) *scaledWidth) +((x* scale)+sx) )*4 + 0] = toR(intColor); // R
            image.data[(( ((y* scale)+sy) *scaledWidth) +((x* scale)+sx) )*4 + 1] = toG(intColor); // G
            image.data[(( ((y* scale)+sy) *scaledWidth) +((x* scale)+sx) )*4 + 2] = toB(intColor); // B
            image.data[(( ((y* scale)+sy) *scaledWidth) +((x* scale)+sx) )*4 + 3] = 255;           // A
          }
        }
      }
    }
  }

  function toB(num) {
    num >>>= 0;
    var b = num & 0xFF;
    return b;
  }

  function toG(num) {
    num >>>= 0;
    var g = (num & 0xFF00) >>> 8;
    return g;
  }

  function toR(num) {
    num >>>= 0;
    var r = (num & 0xFF0000) >>> 16;
    return r;
  }

  function exportGif(canvas) {
    var encoder = new GIFEncoder();
    encoder.setRepeat(0);           // Loop forever
    encoder.setDelay(interval);     // One frame every interval

    // Reset the animation
    var oldFrame = frame;
    var oldScale = scale;
    frame = 10; // Start at frame 10 such that we're not just showing the very beginning
    scale = 1;  // Scale at 1:1
    scaledWidth = width * scale;
    scaledHeight = height * scale;

    // Encode each of the frames
    encoder.start();
    encoder.setSize(width, height);
    var imageData = { data: [] };
    while (frame < 30) {
      console.log('frame...');
      drawFrame(imageData);
      console.log('drawn');
      encoder.addFrame(imageData.data, true);
      console.log('encoded');
      frame++;
    }
    encoder.finish();

    // Restore the previous state
    frame = oldFrame;
    scale = oldScale;
    scaledWidth = width * scale;
    scaledHeight = height * scale;

    // Base-64 encode the data stream
    var stream = encoder.stream();
    return btoa(stream.getData());
  }

  return {
    init: init,
    updateEquation: updateEquation,
    exportGif: exportGif
  };
})();

JS_MOD.EquationManager = (function() {
  var FIELD = 'input[name=equation]';

  function init(form, anim) {
    readHash(form, anim);

    $(window).on('hashchange', function() {
      readHash(form, anim);
    });

    $(form).on('submit', function(e) {
      e.preventDefault();
      triggerUpdate(form, anim);
    });
  }

  function readHash(form, anim) {
    var $field = $(form).find(FIELD);
    if (location.hash) {
      $field.val(atob(location.hash.substring(1)));
    } else {
      $field.val('x * y * time');
    }

    triggerUpdate(form, anim);
  }

  function triggerUpdate(form, anim) {
    var $field = $(form).find(FIELD);
    var equation = $field.val();
    location.hash = '#' + btoa(equation);
    anim.updateEquation(mathparser.parse(equation));
  }

  return {
    init: init
  };
})();

window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback)
  {
    window.setTimeout(callback, 2000);
  };
})();

$(document).ready(function () {
  JS_MOD.Anim.init($('#display'));
  JS_MOD.EquationManager.init($('#equation-form'), JS_MOD.Anim);
});

$('#export').on('click', function(e) {
  e.preventDefault();
  var gif = JS_MOD.Anim.exportGif();
  document.location = 'data:image/gif;base64,' + gif;
});
