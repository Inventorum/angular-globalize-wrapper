angular-globalize-wrapper
=========================

AngularJS wrapper for [jQuery.Globalize](https://github.com/jquery/globalize) library (I18n/L10n).

See [the demo page](http://demo.daemon-notes.com/angular-globalize-wrapper/#/) for examples.

Installation
============

1. Add to **bower.json** "dependencies" section of your project:

  ```
  "angular-globalize-wrapper": "~0.2.0"
  ```

2. Create **.bowerrc** file:

  ```
  {
    "scripts": {
      "preinstall": "npm install cldr-data-downloader",
      "postinstall": "node ./node_modules/cldr-data-downloader/bin/download.js -i bower_components/cldr-data/index.json -o bower_components/cldr-data/"
    }
  }
  ```

  This will fetch and unpack CLDR locale data into **bower_components/cldr-data**.

3. Add required JS scripts to your html file:

  ```html
    <script src="bower_components/cldrjs/dist/cldr.js"></script>
    <script src="bower_components/cldrjs/dist/cldr/event.js"></script>
    <script src="bower_components/cldrjs/dist/cldr/supplemental.js"></script>

    <script src="bower_components/globalize/dist/globalize.js"></script>
    <script src="bower_components/globalize/dist/globalize/message.js"></script>
    <script src="bower_components/globalize/dist/globalize/number.js"></script>
    <script src="bower_components/globalize/dist/globalize/plural.js"></script>
    <script src="bower_components/globalize/dist/globalize/currency.js"></script>
    <script src="bower_components/globalize/dist/globalize/date.js"></script>

    <!-- Your AngularJS scripts here and then the wrapper script: -->
    <script src="bower_components/angular-globalize-wrapper/dist/angular-globalize-wrapper.js"></script>
  ```

4. Add the wrapper module to you AngularJS application:

  ```
    var app = angular.module('app', ['globalizeWrapper']);
  ```

5. Optionally configure the service:

  ```
    app.config(
        [ 'globalizeWrapperProvider',
        function (globalizeWrapperProvider) {
            // The path to cldr-data
            globalizeWrapperProvider.setCldrBasePath('bower_components/cldr-data');

            // The path to translations
            globalizeWrapperProvider.setL10nBasePath('l10n');

            // Files to load in main dir: "{{cldrBasePath}}/main/{{locale}}"
            globalizeWrapperProvider.setMainResources([
                '/currencies.json',
                '/ca-gregorian.json',
                '/timeZoneNames.json',
                '/numbers.json'
            ]);

            // Files to load in supplemental dir: "{{cldrBasePath}}/supplemental'
            globalizeWrapperProvider.setSupplementalResources([
                '/currencyData.json',
                '/likelySubtags.json',
                '/plurals.json',
                '/timeData.json',
                '/weekData.json'
            ]);
        } ]
    );
  ```

6. Prepare the files

  CLDR data is ready to be used, all you need is to create translations for your locales. For example, create "l10n/en.json":

  ```json
    {
        "en": {
            "SAMPLE": "Sample string",
            "TASK": [
                "You have {count, plural,",
                "      =0 {no tasks}",
                "      =1 {one task}",
                "   other {# tasks}",
                "} remaining"
            ],
            "LIKED": [
                "{GENDER, select,",
                "   male{He}",
                " female{She}",
                "  other{They}",
                "} liked this."
            ]
        }
    }
  ```

  The appropriate translation files must exist before switching to the locale.

7. Use Globalize:

  Set initial locale:

  ```
    app.run(
        [ '$rootScope', '$route', 'globalizeWrapper',
        function ($rootScope, $route, globalizeWrapper) {
            $rootScope.$on('GlobalizeLoadSuccess', function () { $route.reload(); });
            globalizeWrapper.setLocale('en');
        } ]
    );
  ```

  This will load 'en' locale on app start. After locale is loaded (indicated by 'GlobalizeLoadSuccess' broadcast from the service) you will need to reload the route as in the example above in order to refresh all the filters.

  You can switch locale at any time, just call globalizeWrapper.setLocale('foo') in your controller.

  This example is using ngRoute module. If you use ui.router you can reload the state like this (instead of **$route.reload()**:

  ```
    $state.go($state.current.name, $stateParams, { reload: true });
  ```

8. Actual internationalization/translation is done with the help of filters:

  See [the demo page](http://demo.daemon-notes.com/angular-globalize-wrapper/#/) for examples.

  See original [API specs](https://github.com/jquery/globalize#api) for filters options.

  * Original **.formatDate( value, pattern )**

    Becomes: {{ value | glDate:pattern }}

    **pattern** is an object

  * Original **.formatMessage( path [, variables ] )**

    Becomes: {{ path | glMessage:variables }}

    **variables** argument is an object and is optional

  * Original **.formatNumber( value [, options] )**

    Becomes: {{ value | glNumber:options }}

    **options** argument is an object and is optional

  * Original **.formatCurrency( value, currency [, options] )**

    Becomes: {{ value | glCurrency:currency:options }}

    **currency** is a string like "USD", **options** is an object and is optional

9. The service

  The **globalizeWrapper** service provides the following methods:

  * **isLoaded()**

    True if globalize data is loaded and the service is initialized

  * **setLocale(locale)**

    Switch current locale to **locale**. Will broadcast either 'GlobalizeLoadSuccess' or 'GlobalizeLoadError' messages.

  * **getLocale()**

    Returns current locale

  * **getGlobalize(locale)**

    Returns the globalize object instance for the given locale.

    **locale** argument is optional, current locale will be used if it is omitted.

    **NOTE**: You must call **setLocale(locale)** at least once before trying to get Globalize object for the **locale**.

  * **hasMessage(path, locale)**

    Return true if path is present in translation file.

    **locale** argument is optional, current locale will be used if it is omitted.
