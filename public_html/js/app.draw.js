/**
 * Application: Draw
 *
 * @package ajwm.Applications
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @class
 */
var ApplicationDraw = (function($, undefined) {


  // Get the mouse position relative to the canvas element.
  function mouseposX(ev) {
    var x;
    if (ev.layerX || ev.layerX === 0) { // Firefox
      x = ev.layerX;
    } else if (ev.offsetX || ev.offsetX === 0) { // Opera
      x = ev.offsetX;
    }
    return x;
  }

  // Get the mouse position relative to the canvas element.
  function mouseposY(ev) {
    var y;
    if (ev.layerX || ev.layerX === 0) { // Firefox
      y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX === 0) { // Opera
      y = ev.offsetY;
    }
    return y;
  }

  function _save(file, content, callback) {
    callback = callback || function() {};

    if ( typeof file == "string" && file ) {
      api.system.call("write", {'file' : file, 'content' : content}, function(result, error) {
        // SYSTEM HANDLES ERRORS
      });
    }
  }

  function _saveAs(content, callback) {
    api.system.dialog_file(function() {
      callback();
    }, null, "save");
  }

  /*
  function _open(callback) {
    api.system.dialog_file(function(fname) {
      callback(fname);
    }, ["image/ *"]);
  }
  */

  var startPosX = 0;
  var startPosY = 0;
  var useFill = true;

  Tools = {

    'pencil' : {
      mousedown : function(ev, context, canvas) {
        context.beginPath();
        context.moveTo(mouseposX(ev), mouseposY(ev));
      },

      mousemove : function(ev, context, canvas) {
        context.lineTo(mouseposX(ev), mouseposY(ev));
        context.stroke();
      },

      mouseup : function(ev, context, canvas) {

      }
    },

    'brush' : {
      mousedown : function(ev, context, canvas) {
      },
      mousemove : function(ev, context, canvas) {
      },
      mouseup : function(ev, context, canvas) {
      }
    },

    'line' : {
      mousedown : function(ev, context, canvas) {
      },
      mousemove : function(ev, context, canvas) {
        context.beginPath();
        context.moveTo(startPosX, startPosY);
        context.lineTo(mouseposX(ev), mouseposY(ev));
        context.stroke();
        context.closePath();

      },
      mouseup : function(ev, context, canvas) {
      }
    },

    'rectangle' : {
      mousedown : function(ev, context, canvas) {
      },
      mousemove : function(ev, context, canvas) {
        var mX = mouseposX(ev);
        var mY = mouseposY(ev);
        var x = Math.min(mX, startPosX);
        var y = Math.min(mY, startPosY);
        var w = Math.abs(mX - startPosX);
        var h = Math.abs(mY - startPosY);

        if (!w || !h) {
          return;
        }

        context.strokeRect(x, y, w, h);
        if ( useFill ) {
          context.fillRect(x, y, w, h);
        }
      },
      mouseup : function(ev, context, canvas) {
      }
    },

    'circle' : {
      mousedown : function(ev, context, canvas) {
      },
      mousemove : function(ev, context, canvas) {
        var mX = mouseposX(ev);
        var mY = mouseposY(ev);
        var posX = Math.abs(startPosX - mX);
        var posY = Math.abs(startPosY - mY);

        var r = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));

        if ( r > 0 ) {
          context.beginPath();
          context.arc(startPosX,startPosY,r,0,Math.PI*2,true);
          context.closePath();
          context.stroke();

          if ( useFill ) {
            context.fill();
          }
        }

      },
      mouseup : function(ev, context, canvas) {
      }
    }

  };

  return function(Application, app, api, argv) {
    var _ApplicationDraw = Application.extend({
      init : function() {
        this._super("ApplicationDraw");
      },

      destroy : function() {
        this._super();
      },

      run : function() {
        var el = app.$element;

        var canvaso  = el.find("canvas").get(0);
        var contexto = canvaso.getContext('2d');
        var canvas   = $(canvaso).parent().append("<canvas></canvas>").find("canvas").get(1);
        var context  = canvas.getContext('2d');

        var isDrawing       = false;
        var currentTool     = null;
        var currentToolText = null;
        var currentToolObj  = null;

        canvas.width   = $(el).find(".WindowContent").width();
        canvas.height  = $(el).find(".WindowContent").height();
        canvaso.width  = canvas.width;
        canvaso.height = canvas.height;

        context.strokeStyle = $(el).find(".color_Foreground").css("background-color");
        context.fillStyle   = $(el).find(".color_Background").css("background-color");

        $(canvas).css({
          "position" : "absolute",
          "top"      : "0px",
          "left"     : "0px"
        });

        $(canvas).mousedown(function(ev) {
          if ( !isDrawing ) {
            isDrawing = true;

            startPosX = mouseposX(ev);
            startPosY = mouseposY(ev);

            currentToolObj.mousedown(ev, context, canvas);

            //ev.preventDefault();
            //ev.stopPropagation();
          }
        }).mousemove(function(ev) {
          if ( isDrawing ) {
            context.clearRect(0, 0, canvas.width, canvas.height);

            currentToolObj.mousemove(ev, context, canvas);

            //ev.preventDefault();
            //ev.stopPropagation();
          }
        }).mouseup(function(ev) {
          if ( isDrawing ) {
            //ev.preventDefault();
            //ev.stopPropagation();

            currentToolObj.mouseup(ev, context, canvas);

            contexto.drawImage(canvas, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);

            isDrawing = false;
          }

        }).click(function(ev) {
        });

        $(el).find("canvas").bind("contextmenu",function(e) {
          return false;
        });

        $(el).find(".ApplicationDrawPanel button").click(function() {
          if ( $(this)[0] != $(currentTool)[0] ) {
            if ( currentTool !== null ) {
              $(currentTool).removeClass("Current");
            }

            currentTool = this;
            currentToolText = $(currentTool).attr("class").replace("draw_", "");
            currentToolObj = Tools[currentToolText.toLowerCase()];

            $(this).addClass("Current");
          }
        });

        $($(el).find(".ApplicationDrawPanel button").get(0)).click();

        $(el).find(".color_Foreground").click(function() {
          var color = '#'+Math.floor(Math.random()*16777215).toString(16);
          $(el).find(".color_Foreground").css("background-color", color);
          context.strokeStyle = color;
        });

        $(el).find(".color_Background").click(function() {
          var color = '#'+Math.floor(Math.random()*16777215).toString(16);
          $(el).find(".color_Background").css("background-color", color);
          context.fillStyle = color;
        });

        $(el).find(".enable_Fill").click(function() {
          useFill = this.checked ? true : false;
        });

        /*
        $(el).find(".WindowMenu .cmd_Open").parent().click(function() {
          _open(function(fname) {
            _read_file(fname);
          });
        });
        */

        $(el).find(".WindowMenu .cmd_Save").parent().click(function() {
          if ( argv && argv['path'] ) {
            var img = canvas.toDataURL("image/png");
            _save(argv['path'], img);
          }
        });

        $(el).find(".WindowMenu .cmd_SaveAs").parent().click(function() {
          var img = canvas.toDataURL("image/png");
          _saveAs(img, function() {
            //_update(null, el);
          });
        });

        $(el).find(".WindowMenu .cmd_New").parent().click(function() {
          app.$element.find("textarea").val("");
          _update(null, el);
        });

        this._super();
      }
    });

    return new _ApplicationDraw();
  };
})($);
