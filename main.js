/*!
 * @file
 * OS.js - JavaScript Operating System - main node server
 *
 * Copyright (c) 2011-2012, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @created 2013-01-27
 */

/*
 *
 * TODO: Session
 * TODO: Users
 * TODO: User packages
 * TODO: Rest of Core API
 * TODO: VFS
 * TODO: Application Events
 * TODO: Locales
 *
 */

///////////////////////////////////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////////////////////////////////

var config    = require('./config.js'),
    _registry  = require(config.PATH_SRC + '/registry.js'),
    _settings  = require(config.PATH_SRC + '/settings.js'),
    _preload   = require(config.PATH_SRC + '/preload.js'),
    _packages  = require(config.PATH_SRC + '/packages.js');

var express = require('express'),
    sprintf = require('sprintf').sprintf,
    swig    = require('swig');

///////////////////////////////////////////////////////////////////////////////
// APPLICATION
///////////////////////////////////////////////////////////////////////////////

var app = express();

swig._cache = {};
swig.express3 = function (path, options, fn) {
  swig._read(path, options, function (err, str) {
    if ( err ) {
      return fn(err);
    }

    try {
      options.filename = path;
      var tmpl = swig.compile(str, options);
      fn(null, tmpl(options));
    } catch (error) {
      fn(error);
    }

    return true;
  });
};

swig._read = function (path, options, fn) {
  var str = swig._cache[path];

  // cached (only if cached is a string and not a compiled template function)
  if (options.cache && str && typeof str === 'string') {
    return fn(null, str);
  }

  // read
  require('fs').readFile(path, 'utf8', function (err, str) {
    if (err) {
      return fn(err);
    }
    if (options.cache) {
      swig._cache[path] = str;
    }
    fn(null, str);

    return true;
  });

  return true;
};

///////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////

function defaultResponse(req, res) {
  var body = req.url;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', body.length);
  res.end(body);
}

function defaultJSONResponse(req, res) {
  res.json(200, { url: req.url });
}

function generateIndex(req, res) {
  var opts = config;

  opts.locale   = "en_US"; // FIXME
  opts.preloads = [
    {"script" : 'json.js'},
    {"script" : 'sprintf.js'},
    {"script" : 'jquery.js'},
    {"script" : 'jquery-ui.js'},
    {"style"  : 'jquery-ui-theme.css'}
  ];

  res.render('index', opts);
}

function generateFontCSS(filename) {
  var font = filename.replace(/[^a-zA-Z0-9]/, '');

  var sources = {
    "normal"   : sprintf("%s/%s.ttf",        config.URI_FONT, filename),
    "bold"     : sprintf("%s/%sBold.ttf",    config.URI_FONT, filename),
    "italic"   : sprintf("%s/%s%s.ttf",      config.URI_FONT, filename, (font == "FreeSerif" ? "Italic" : "Oblique")),
    "bitalic"  : sprintf("%s/%sBold%s.ttf",  config.URI_FONT, filename, (font == "FreeSerif" ? "Italic" : "Oblique"))
  };

  // Load from cache

  // Render CSS template
  var opts = {
      normal  : sources.normal,
      bold    : sources.bold,
      italic  : sources.italic,
      bitalic : sources.bitalic,
      bcstart : "",
      bcend   : ""
  };

  if ( font == "Sansation" ) {
    opts.bcstart  = "/*";
    opts.bcend    = "*/";
  }

  var file = ([config.PATH_TEMPLATES, 'resource.font.css']).join("/");
  var css  = swig.compileFile(file).render(opts);

  return css;
}

///////////////////////////////////////////////////////////////////////////////
// CONFIGURATION
///////////////////////////////////////////////////////////////////////////////

app.configure(function() {

  app.use(express.bodyParser());

  app.engine('html', swig.express3);

  app.set('view engine',  'html');
  app.set('views',        config.PATH_TEMPLATES);
  app.set('view options', { layout: false });

  app.set('view cache', false);

  app.get('/', function(req, res) {
    console.log('GET /');

    generateIndex(req, res);
  });

  app.post('/', function(req, res) {
    console.log('POST /');

    var jsn, action, response = null;
    try {
      jsn     = req.body;//.objectData;
      action  = jsn.action;

      console.log('AJAX /', action);
    } catch ( e ) {
      jsn = {};
      console.error(e);
    }

    if ( action === null  ) {
      defaultJSONResponse(req, res);
    } else {
      switch ( jsn.action ) {
        case 'boot' :
          // TODO: Session
          response = {
            success : true,
            result : {
              environment : {
                bugreporting : config.BUGREPORT_ENABLE,
                production   : config.ENV_PRODUCTION,
                demo         : config.ENV_DEMO,
                cache        : config.ENABLE_CACHE,
                connection   : config.ENV_PLATFORM,
                ssl          : config.ENV_SSL,
                autologin    : config.AUTOLOGIN_ENABLE,
                restored     : [],
                hosts        : {
                  frontend      : config.HOST_FRONTEND,
                  'static'      : config.HOST_STATIC
                }
              }
            }
          };

          res.json(200,  response);
        break;

        case 'logout' :
          // TODO: Session
          // TODO: Update user
          response = {
            success : true,
            result : {
            }
          };

          res.json(200, response);
        break;

        case 'login' :
          var user        = {   // FIXME
            result : {
              uid       : 1,
              sid       : '',
              duplicate : false,
              info      : {
                "User ID"       : "",
                "Username"      : "",
                "Name"          : "",
                "Groups"        : [],
                "Registered"    : "",
                "Last Modified" : "",
                "Last Login"    : "",
                "Browser"       : ""
              }
            },
            language          : "en_US",
            resume_registry   : {},
            resume_session    : {}
          };

          var _success = function(packages) {
            response = {
              success : true,
              result : {
                user          : user.result,
                registry      : {
                  revision      : config.SETTINGS_REVISION,
                  settings      : _settings.getDefaultSettings(_registry.defaults),
                  packages      : packages,
                  preload       : _preload.getPreloadFiles()
                },
                restore      : {
                  registry      : user.resume_registry,
                  session       : user.resume_session
                },
                locale       : {
                  system        : config.DEFAULT_LANGUAGE,
                  browser       : user.language
                }
              }
            };

            // TODO: Update user

            res.json(200, response);
          };

          var _failure = function(msg) {
            console.error(msg);

            res.json(500, {success: false, error: msg});
          };

          _packages.getInstalledPackages(user, function(success, result) {
            if ( success ) {
              _success(result);
            } else {
              _failure(result);
            }
          });
        break;

        case 'shutdown' :
          // TODO: Session
          // TODO: Update user
          response = {
            success : true,
            result : {
            }
          };

          res.json(200, response);
        break;

        default :
          res.json(200, { success: false, error: 'Invalid action!' });
        break;
      }
    }
  });

  //app.get('/UI/:type/:filename', function(req, res) {
  app.get(/^\/UI\/(sound|icon)\/(.*)/, function(req, res) {
    //var type = req.params.type.replace(/[^a-zA-Z0-9]/, '');
    var type = req.params[0].replace(/[^a-zA-Z0-9]/, '');
    //var filename = req.params.filename.replace(/[^a-zA-Z0-9-\_]/, '');
    var filename = req.params[1].replace(/[^a-zA-Z0-9-\_\/\.]/, '');

    console.log('/UI/:type/:filename', type, filename);

    switch ( type ) {
      case 'sound' :
        res.sendfile(sprintf('%s/Shared/Sounds/%s', config.PATH_MEDIA, filename));
      break;
      case 'icon' :
        res.sendfile(sprintf('%s/Shared/Icons/%s', config.PATH_MEDIA, filename));
      break;
      default :
        defaultResponse(req, res);
      break;
    }
  });

  app.get('/VFS/resource/:package/:filename', function(req, res) {
    var filename = req.params.filename;
    var pkg = req.params['package'];

    console.log('/VFS/resource/:package/:filename', pkg, filename);
    if ( req.params.filename.match(/\.js|\.css$/) ) {
      res.sendfile(sprintf('%s/%s/%s', config.PATH_PACKAGES, pkg, filename));
    } else {
      throw "Invalid file";
    }
  });

  app.get('/VFS/resource/:filename', function(req, res) {
    var filename = req.params.filename;

    console.log('/VFS/resource/:filename', filename);
    if ( req.params.filename.match(/\.js|\.css$/) ) {
      res.sendfile(sprintf('%s/%s', config.PATH_JAVASCRIPT, filename));
    } else {
      throw "Invalid file";
    }
  });

  app.get('/VFS/:resource/:filename', function(req, res) {
    var filename = req.params.filename;
    var type = req.params.resource;

    console.log('/VFS/:resource/:filename', filename, type);

    switch ( type ) {
      case 'font' :
        var css = generateFontCSS(filename);
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Content-Length', css.length);
        res.end(css);
        break;
      case 'theme' :
        var theme = filename.replace(/[^a-zA-Z0-9_\-]/, '');
        res.sendfile(sprintf('%s/theme.%s.css', config.PATH_JAVASCRIPT, theme));
        break;
      case 'cursor' :
        var cursor = filename.replace(/[^a-zA-Z0-9_\-]/, '');
        res.sendfile(sprintf('%s/cursor.%s.css', config.PATH_JAVASCRIPT, cursor));
        break;
      case 'language' :
        var lang = filename.replace(/[^a-zA-Z0-9_\-]/, '');
        res.sendfile(sprintf('%s/%s.js', config.PATH_JSLOCALE, lang));
        break;
      default :
        defaultResponse(req, res);
        break;
    }
  });

  app.post('/API/upload', function(req, res) {
    defaultResponse(req, res);
  });

  app.get('/media/User:filename', function(req, res) {
    defaultResponse(req, res);
  });

  app.get('/media-download/User:filename', function(req, res) {
    defaultResponse(req, res);
  });

  app.use("/", express['static'](config.PATH_PUBLIC));

});

///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////

app.listen(3000);
console.log('Listening on port 3000');

