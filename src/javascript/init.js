/*!
 * OS.js - JavaScript Operating System - Namespace and main initialization
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
 * @package OSjs.Core.Init
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function($, undefined) {

  //
  // Override for browsers without console
  //
  if (!window.console) console = {log:function() {}, info:function(){}, error:function(){}};
  if ( !window.console.group ) {
    window.console.group = function() { console.log(arguments); };
  }
  if ( !window.console.groupEnd ) {
    window.console.groupEnd = function() { console.log(arguments); };
  }

  //
  // Main OS.js namespace
  //
  window.OSjs =
  {
    // Internal namespace containers
    Compability  : { /* ... */ },
    Labels       : { /* ... */ },
    Public       : { /* ... */ },

    // Dynamic namespace containers
    Dialogs      : { /* ... */ }, // @see core,Dialog.class.php - Dynamic
    Packages     : { /* ... */ }, // @see Package.class.php, and it's classes
    Classes      : { /* ... */ }  // @see classes.js
  };

  //
  // Compability checking
  //
  var canvas_supported  = !!document.createElement('canvas').getContext;
  var video_supported   = !!document.createElement('video').canPlayType ? document.createElement('video') : null;
  var audio_supported   = !!document.createElement('audio').canPlayType ? document.createElement('audio') : null;
  var ns                = ns = {'svg': 'http://www.w3.org/2000/svg'};

  OSjs.Compability = {
    "SUPPORT_UPLOAD"         : false,
    "SUPPORT_LSTORAGE"       : (('localStorage'    in window) && window['localStorage']   !== null),
    "SUPPORT_SSTORAGE"       : (('sessionStorage'  in window) && window['sessionStorage'] !== null),
    "SUPPORT_GSTORAGE"       : (('globalStorage'   in window) && window['globalStorage']  !== null),
    "SUPPORT_DSTORAGE"       : (('openDatabase'    in window) && window['openDatabase']   !== null),
    "SUPPORT_SOCKET"         : (('WebSocket'       in window) && window['WebSocket']      !== null),
    "SUPPORT_WORKER"         : (('Worker'          in window) && window['Worker']         !== null),
    "SUPPORT_CANVAS"         : (canvas_supported),
    "SUPPORT_WEBGL"          : false,
    "SUPPORT_CANVAS_CONTEXT" : [],
    "SUPPORT_FS"             : (('requestFileSystem' in window) || ('webkitRequestFileSystem' in window)),
    "SUPPORT_SVG"            : (!!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect),

    // http://www.w3.org/TR/html5/video.html
    "SUPPORT_VIDEO"          : (!!video_supported),
    "SUPPORT_VIDEO_WEBM"     : (video_supported && !!video_supported.canPlayType('video/webm; codecs="vp8.0, vorbis"')),
    "SUPPORT_VIDEO_OGG"      : (video_supported && !!video_supported.canPlayType('video/ogg; codecs="theora"')),
    "SUPPORT_VIDEO_H264"     : (video_supported && !!(video_supported.canPlayType('video/mp4; codecs="avc1.42E01E"') || video_supported.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'))),
    "SUPPORT_VIDEO_MPEG"     : (video_supported && !!video_supported.canPlayType('video/mp4; codecs="mp4v.20.8"')),
    "SUPPORT_VIDEO_MKV"      : (video_supported && !!video_supported.canPlayType('video/x-matroska; codecs="theora, vorbis"')),
    "SUPPORT_AUDIO"          : (!!audio_supported),
    "SUPPORT_AUDIO_OGG"      : (audio_supported && !!audio_supported.canPlayType('audio/ogg; codecs="vorbis')),
    "SUPPORT_AUDIO_MP3"      : (audio_supported && !!audio_supported.canPlayType('audio/mpeg')),
    "SUPPORT_AUDIO_WAV"      : (audio_supported && !!audio_supported.canPlayType('audio/wav; codecs="1"')),
    "SUPPORT_RICHTEXT"       : (!!document.createElement('textarea').contentEditable),
    "SUPPORT_DND"            : ('draggable' in document.createElement('span'))
  };

  delete canvas_supported;
  delete video_supported;
  delete audio_supported;
  delete ns;

  if ( canvas_supported ) {
    var test = ["2d", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var canv = document.createElement('canvas');
    var lst  = [];

    for ( var i = 0; i < test.length; i++ ) {
      try {
        if ( !!canv.getContext(test[i]) ) {
          lst.push(i);
        }
      } catch ( eee ) {}
    }

    OSjs.Compability.SUPPORT_CANVAS_CONTEXT = lst;
    OSjs.Compability.SUPPORT_WEBGL          = lst.length > 1;

    delete lst;
    delete i;
    delete test;
    delete canv;
  }

  try {
    var xhr = new XMLHttpRequest();
    OSjs.Compability.SUPPORT_UPLOAD = (!! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload)));
  } catch ( eee ) {}

  //
  // Compability feature checking mapping
  //
  OSjs.Public.CompabilityErrors   = {}; // See locale/<lang>.js
  OSjs.Public.CompabilityMapping  = {
    "canvas"          : OSjs.Compability.SUPPORT_CANVS,
    "webgl"           : OSjs.Compability.SUPPORT_WEBGL,
    "audio"           : OSjs.Compability.SUPPORT_AUDIO,
    "audio_ogg"       : OSjs.Compability.SUPPORT_AUDIO_OGG,
    "audio_mp3"       : OSjs.Compability.SUPPORT_AUDIO_MP3,
    "audio_wav"       : OSjs.Compability.SUPPORT_AUDIO_WAV,
    "video"           : OSjs.Compability.SUPPORT_VIDEO,
    "video_webm"      : OSjs.Compability.SUPPORT_VIDEO_WEBM,
    "video_h264"      : OSjs.Compability.SUPPORT_VIDEO_H264,
    "video_ogg"       : OSjs.Compability.SUPPORT_VIDEO_OGG,
    "video_mpeg"      : OSjs.Compability.SUPPORT_VIDEO_MPEG,
    "video_mkv"       : OSjs.Compability.SUPPORT_VIDEO_MKV,
    "localStorage"    : OSjs.Compability.SUPPORT_LSTORAGE,
    "sessionStorage"  : OSjs.Compability.SUPPORT_SSTORAGE,
    "globalStorage"   : OSjs.Compability.SUPPORT_GSTORAGE,
    "databaseStorage" : OSjs.Compability.SUPPORT_DSTORAGE,
    "socket"          : OSjs.Compability.SUPPORT_SOCKET,
    "richtext"        : OSjs.Compability.SUPPORT_RICHTEXT,
    "upload"          : OSjs.Compability.SUPPORT_UPLOAD,
    "worker"          : OSjs.Compability.SUPPORT_WORKER,
    "filesystem"      : OSjs.Compability.SUPPORT_FS,
    "svg"             : OSjs.Compability.SUPPORT_SVG
  };

})($);

