'use strict';

var Porthole = require('./lib/porthole');
var EventListener = require('./lib/event-listener');

function AppNexusHTML5Lib ()  {
  var self = this;
  this.debug = false;
  this.inFrame = false;
  this.EventListener = EventListener;

  var isClient = false;
  var readyCalled = false;
  var isPageLoaded = false;
  var expandProperties = {}
  var dispatcher = new EventListener();
  var clientPorthole;
  var adData = {};

  try {
    this.inFrame = (window.self !== window.top);
  } catch (e) {
    this.inFrame = true;
  }

  dispatcher.addEventListener('ready', function () {
    if (readyCalled) {
      initPorthole();
      if (self.debug) console.info('Client initialized!');
    }
  });

  /**
   * Setup porthole so we can talk to our parent and listen to messages from it
   */
  var initPorthole = function(){
    clientPorthole = new Porthole.WindowProxy();
    clientPorthole.addEventListener(handleMessages);
    clientPorthole.post({ action: 'ready'}); //notify parent we are ready
  };

  var checkReady = function (f){ /in/.test(document.readyState) ? setTimeout(function () { checkReady(f); } , 9) : f(); }
  checkReady(function (){
    isPageLoaded = true;
    dispatcher.dispatchEvent('ready');
  });

  var openUrl = function(url){
    window.open(url, "_blank");
  };

  /**
   * Listen to messages that come from the parent window
   * @param messageEvent
   */
  var handleMessages = function(messageEvent){
    switch(messageEvent.data.action) {
      case 'setAdData':  //receive data about the ad
        adData = messageEvent.data.parameters;
        break;
    }
  };

  this.ready = function (callback) {
    if (!readyCalled) {
      readyCalled = true;
      self.debug = !self.inFrame;
      if (typeof callback === 'function') {
        dispatcher.addEventListener('ready', callback);
      }

      if (isPageLoaded) {
        dispatcher.dispatchEvent('ready');
      }
    }
  }

  this.click = function () {
    if (!readyCalled || !clientPorthole) throw new Error('APPNEXUS library has not been initialized. APPNEXUS.ready() must be called first');
    openUrl(adData.landingPageUrl);
    if (self.debug) console.info('Client send action: click');
  }

  this.setExpandProperties = function (props) {
    if (!readyCalled || !clientPorthole) throw new Error('APPNEXUS library has not been initialized. APPNEXUS.ready() must be called first');
    expandProperties = props;
    clientPorthole.post({ action: 'set-expand-properties', properties: props });
    if (self.debug) console.info('Client send action: set-expand-properties');
  }

  this.getExpandProperties = function () {
    return expandProperties;
  }

  this.expand = function () {
    if (!readyCalled || !clientPorthole) throw new Error('APPNEXUS library has not been initialized. APPNEXUS.ready() must be called first');
    clientPorthole.post({ action: 'expand' });
    if (self.debug) console.info('Client send action: expand');
  }

  this.collapse = function () {
    if (!readyCalled || !clientPorthole) throw new Error('APPNEXUS library has not been initialized. APPNEXUS.ready() must be called first');
    clientPorthole.post({ action: 'collapse' });
    if (self.debug) console.info('Client send action: collapse');
  }
}

var APPNEXUS = new AppNexusHTML5Lib();
if (typeof window !== 'undefined') {
  window.APPNEXUS = APPNEXUS;
}

module.exports = APPNEXUS;