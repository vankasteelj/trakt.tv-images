### Trakt.tv OnDeck
Extends https://github.com/vankasteelj/trakt.tv node module, in order to get images for a given episode/show/movie

NOTICE: requires trakt.tv module! Load this plugin directly through `trakt.tv` module.

1) Install:

```npm install trakt.tv trakt.tv-images```

2) Load the plugin:

```js
var Trakt = require('trakt.tv');
var trakt = new Trakt({
    client_id: '',
    client_secret: '',
    plugins: ['images'],
    fanartApiKey: '<your api key>' // check: https://fanart.tv/get-an-api-key/
});
```

3) Log in with trakt.tv, then call "ondeck":
```js

```

---
License MIT, (c) vankasteelj
