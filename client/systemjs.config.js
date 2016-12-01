(function() {
  // map tells the System loader where to look for things
  var map = {
    'app': 'app',
    '@angular': '@angular',
    'rxjs': 'rxjs'//,
     //"socket.io-client": "socket.io-client/socket.io.js"
  };
  // packages tells the System loader how to load when no filename and/or no extension
  var packages = {
    'app': { main: 'main.js',  defaultExtension: 'js' },
    'rxjs': { defaultExtension: 'js' }//,
    //"socket.io-client": {"defaultExtension": "js"}
  };
  var ngPackageNames = [
    'common',
    'compiler',
    'core',
    'forms',
    'http',
    'platform-browser',
    'platform-browser-dynamic',
    'router'
  ];
  ngPackageNames.forEach(function(pkgName) {
    packages['@angular/'+pkgName] = { main: 'bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
  });
  var config = {
    map: map,
    packages: packages
  };
  System.config(config);
})();
