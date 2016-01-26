'use strict';

var glModule = angular.module('globalizeWrapper', []);

var globalizeInstances = {};
var localeChanged = false;
var mainLoaded = true, supplementalLoaded = false, messagesLoaded = false;
var mainData = [], supplementalData = [], messagesData = {};
glModule.provider('globalizeWrapper', function () {
  var cldrBasePath = 'bower_components/cldr-data';
  var l10nBasePath = 'l10n';
  var l10nEnabled = true;
  var mainResources = [
    'currencies.json',
    'ca-gregorian.json',
    'timeZoneNames.json',
    'numbers.json'
  ];
  var supplementalResources = [
    'currencyData.json',
    'likelySubtags.json',
    'plurals.json',
    'timeData.json',
    'weekData.json'
  ];

  this.$get = ['$q', '$http', '$rootScope', function ($q, $http, $rootScope) {
    var currentLocale = null;
    if (!supplementalLoaded) {
      $http.get(cldrBasePath + '/availableLocales.json').then(function (results) {
        var availableLocales = results.data.availableLocales;
        Cldr._availableBundleMapQueue = availableLocales.filter(function (name) {
          return name != 'root'
        });

        loadResources(
          cldrBasePath + '/supplemental',
          supplementalResources,
          function (results) {
            for (var i = 0; i < results.length; i++) {
              Globalize.load(results[i].data);
            }
            supplementalLoaded = true;
            finishLoading();
          }
        );
      });

    } else {
      finishLoading();
    }
    function loadResources(basePath, resources, success) {
      var promises = [];
      for (var i = 0; i < resources.length; i++)
        promises.push($http.get(basePath + '/' + resources[i]));

      $q.all(promises)
        .then(success)
        .catch(function () {
          $rootScope.$broadcast('GlobalizeLoadError');
        });
    };

    function isLoaded() {
      return (mainLoaded && supplementalLoaded && (!l10nEnabled || messagesLoaded));
    };

    function setLocale(locale) {
      if (currentLocale == locale) {
        finishLoading();
        return;
      }

      localeChanged = false;
      currentLocale = locale;

      if (typeof globalizeInstances[currentLocale] != 'undefined') {
        finishLoading();
        return;
      }

      //we use this magic to get proper bundle name
      var cldrTmpObj = new Cldr(locale);
      var bundleName = cldrTmpObj.attributes.bundle;
      console.log("Cldr 1 bundle name is: " + bundleName);

      mainLoaded = false;
      loadResources(cldrBasePath + '/main/' + bundleName, mainResources, function (results) {
          for (var i = 0; i < results.length; i++) {
            Globalize.load(results[i].data);
          }
          mainLoaded = true;
          finishLoading();
        }
      );
    };

    function finishLoading() {
      if (!isLoaded())
        return;

      localeChanged = true;

      if (typeof globalizeInstances[currentLocale] == 'undefined') {
        var instance = null;
        if (currentLocale) {
          instance = Globalize(currentLocale);
        }

        globalizeInstances[currentLocale] = instance;
      }

      $rootScope.$broadcast('GlobalizeLoadSuccess');
    };

    return {
      isLoaded: isLoaded,
      setLocale: setLocale,
      getLocale: function () {
        return currentLocale;
      },
      getGlobalize: function (locale) {
        if (typeof locale == 'undefined')
          locale = currentLocale;
        return globalizeInstances[locale];
      },
      hasMessage: function (path, locale) {
        if (typeof locale == 'undefined')
          locale = currentLocale;
        return typeof messagesData[locale][path] != 'undefined';
      },
    };
  }];

  this.setCldrBasePath = function (path) {
    cldrBasePath = path;
  };

  this.setL10nBasePath = function (path) {
    l10nBasePath = path;
  };

  this.setL10nEnabled = function (status) {
    l10nEnabled = status;
  };

  this.setMainResources = function (resources) {
    mainResources = resources;
  };

  this.setSupplementalResources = function (resources) {
    supplementalResources = resources;
  };
});

glModule.filter('glDate',
  ['globalizeWrapper',
    function (globalizeWrapper) {
      return function (input, params) {
        if (angular.isUndefined(input) || angular.isUndefined(params))
          return undefined;
        if (input.length == 0 || !globalizeWrapper.isLoaded())
          return '';

        var gl = globalizeWrapper.getGlobalize();
        return gl ? gl.formatDate(input, params) : input;
      };
    }]
);

glModule.filter('glMessage',
  ['globalizeWrapper',
    function (globalizeWrapper) {
      return function (input, params) {
        if (angular.isUndefined(input))
          return undefined;
        if (input.length == 0 || !globalizeWrapper.isLoaded())
          return '';
        if (!globalizeWrapper.hasMessage(input)) {
          console.log('Missing translation: ' + input);
          return input;
        }

        var gl = globalizeWrapper.getGlobalize();
        return gl ? gl.formatMessage(input, params) : input;
      };
    }]
);

glModule.filter('glNumber',
  ['globalizeWrapper',
    function (globalizeWrapper) {
      return function (input, params) {
        if (angular.isUndefined(input))
          return undefined;
        if (input.length == 0 || !globalizeWrapper.isLoaded())
          return '';

        var gl = globalizeWrapper.getGlobalize();
        return gl ? gl.formatNumber(input, params) : input;
      };
    }]
);

glModule.filter('glCurrency',
  ['globalizeWrapper',
    function (globalizeWrapper) {
      return function (input, currency, params) {
        if (angular.isUndefined(input) || angular.isUndefined(currency))
          return undefined;
        if (input.length == 0 || !globalizeWrapper.isLoaded())
          return '';

        var gl = globalizeWrapper.getGlobalize();
        return gl ? gl.formatCurrency(input, currency, params) : input;
      };
    }]
);
