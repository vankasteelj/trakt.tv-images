# Trakt.tv Images
Extends https://github.com/vankasteelj/trakt.tv node module, in order to get images for a given episode/show/movie.
Image sources:
- fanart.tv
- tmdb (movies only)
- tvdb (series/episodes only)
- omdbapi

NOTICE: requires trakt.tv module! Load this plugin directly through `trakt.tv` module.

### Install:

```
    npm install trakt.tv trakt.tv-images
```

### Load the plugin:

```js
    Trakt = require('trakt.tv');
    trakt = new Trakt({
        client_id: <trakt client id>,
        client_secret: <trakt client secret>,
        plugins: ['images'],
        fanartApiKey: <fanart api key>,     // optionnal
        tvdbApiKey: <tvdb api key>,         // optionnal
        tmdbApiKey: <tmdb api key>          // optionnal
    }, true);
});
```

### Log in with trakt.tv, then call "images":
```js
// Movie: terminator genesys
trakt.images.get('tt1340138', 'movie')
    .then(console.log.bind(console))
    .catch(console.log.bind(console));

// Show: Game of Thrones
trakt.images.get('121361', 'show')
    .then(console.log.bind(console))
    .catch(console.log.bind(console));

trakt.images.get('tt0944947', 'show')
    .then(console.log.bind(console))
    .catch(console.log.bind(console));

// Episode: Game of Thrones, s01e01
trakt.images.get('3254641', 'episode')
    .then(console.log.bind(console))
    .catch(console.log.bind(console));

trakt.images.get('tt1480055', 'episode')
    .then(console.log.bind(console))
    .catch(console.log.bind(console));
```

Note: call is `trakt.images.get(id, type)` where `id` is from imdb (with mandatory 'tt' prefix!) or tvdb, and `type` is 'movie', 'show' or 'episode'.

### Example response
```js
Object {
    background: "http://assets.fanart.tv/fanart/tv/121361/showbackground/game-of-thrones-4fd5fa8ed5e1b.jpg"
    poster: "http://thetvdb.com/banners/posters/121361-1.jpg"
}
```

## License
The MIT License (MIT) - Copyright (c) 2016 vankasteelj <vankasteelj@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.