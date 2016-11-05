var Images = module.exports = {}; // Skeleton
var Trakt; // the main API for trakt (npm: 'trakt.tv')
var got = require('got');
var Omdb = require('omdbapi');
var fanart = require('fanart.tv');
var Fanart = false;
var TmdbApiKey = false;
var TvdbApiKey = false;
var Small = false;

// Initialize the module
Images.init = function(trakt, opts) {
    Trakt = trakt;
    if (opts.smallerImages) Small = true;
    if (opts.fanartApiKey) Fanart = new fanart(opts.fanartApiKey);
    if (opts.tmdbApiKey) TmdbApiKey = opts.tmdbApiKey;
    if (opts.tvdbApiKey) {
        got('https://api.thetvdb.com/login', {
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                apikey: opts.tvdbApiKey
            })
        }).then(function(res) {
            if (res.body && res.body.token) {
                TvdbApiKey = res.body.token;
            }
        }).catch(function(err) {});
    };
};

var reduce = function (link) {
    if (!link) {
        return null;
    }

    if (link.match('assets.fanart.tv')) {
        link = link.replace('fanart.tv/fanart', 'fanart.tv/preview');
    } else if (link.match('image.tmdb.org')) {
        link = link.replace('w780', 'w342').replace('/original/', '/w1280/');
    } else if (link.match('tvdb.com')) {
        link = link.replace('banners/', 'banners/_cache/');
    }

    return link;
};

var format = function(res) {
    var background = {
        priority: 0,
        url: null
    };
    var poster = {
        priority: 0,
        url: null
    };

    var map = {
        fanart: 3,
        omdb: 1,
        tvdb: 2,
        tmdb: 2
    };

    for (var i in res) {
        var source = res[i].source;
        var img = res[i].img;
        var priority = map[source];
        if (img && img.background && priority > background.priority) {
            background.priority = priority;
            background.url = img.background;
        }
        if (img && img.poster && priority > poster.priority) {
            poster.priority = priority;
            poster.url = img.poster;
        }
    }

    if (Small) {
        background.url = reduce(background.url);
        poster.url = reduce(poster.url);
    }

    return {
        background: background.url,
        poster: poster.url
    };
};

var getFanart = function(id, type) {
    return new Promise(function(resolve) {
        if (!Fanart || !id || !type) {
            return resolve({
                source: 'fanart',
                img: null
            });
        }

        var fanartCat = type === 'movie' ? 'movies' : 'shows';
        return Fanart[fanartCat].get(id).then(function(images) {
            // build output
            var obj = null;
            var poster, background;
            if (fanartCat === 'movies') {
                poster = images.movieposter ? images.movieposter[0].url : null;
                background = images.moviebackground ? images.moviebackground[0].url :
                    images.hdmovieclearart ? images.hdmovieclearart[0].url :
                    images.moviethumb ? images.moviethumb[0].url : null;
            } else {
                poster = images.tvposter ? images.tvposter[0].url : null;
                background = images.showbackground ? images.showbackground[0].url :
                    images.hdclearart ? images.hdclearart[0].url :
                    images.clearart ? images.clearart[0].url :
                    images.tvthumb ? images.tvthumb[0].url : null;
            }
            if (poster || background) {
                obj = {
                    poster: poster,
                    background: background
                };
            }

            return resolve({
                source: 'fanart',
                img: obj
            });
        }).catch(function(err) {
            return resolve({
                source: 'fanart',
                img: null
            });
        });
    });
};

var getOmdb = function(id, type) {
    return new Promise(function(resolve) {
        if (!id || !type) {
            return resolve({
                source: 'omdb',
                img: null
            });
        }

        var omdbCat = type === 'movie' ? 'movie' : type === 'show' ? 'series' : 'episode';
        return Omdb.get({
            id: id,
            type: omdbCat
        }).then(function(images) {
            // build output
            var obj = null;
            if (images.poster) {
                obj = {
                    poster: images.poster,
                    background: null
                };
            }

            // return
            return resolve({
                source: 'omdb',
                img: obj
            });
        }).catch(function(err) {
            resolve({
                source: 'omdb',
                img: null
            });
        });
    });
};

var getTmdb = function(id) {
    return new Promise(function(resolve) {
        if (!TmdbApiKey || !id) {
            return resolve({
                source: 'tmdb',
                img: null
            });
        }

        // ditry tmdb v3 calls, because all 3rd party modules are (rightfully) bloated
        return got('https://api.themoviedb.org/3/movie/' + id + '/images?api_key=' + TmdbApiKey, {
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            timeout: 1000
        }).then(function(res) {
            var url = 'https://image.tmdb.org/t/p/';
            var bsize = 'original'; // or w1280
            var psize = 'w780'; // or w780

            var built = null, bg = null, pos = null;
            if (res.body) {
                if (res.body.backdrops && res.body.backdrops[0]) {
                    bg = url + bsize + res.body.backdrops[0].file_path;
                }
                if (res.body.posters && res.body.posters[0]) {
                    pos = url + psize + res.body.posters[0].file_path;
                }
                if (bg || pos) {
                    built = {
                        background: bg,
                        poster: pos
                    };
                }
            }

            return resolve({
                source: 'tmdb',
                img: built
            });
        }).catch(function(error) {
            return resolve({
                source: 'tmdb',
                img: null
            });
        });
    });
};

var getTvdb = function(id) {
    return new Promise(function(resolve) {
        if (!TvdbApiKey || !id) {
            return resolve({
                source: 'tvdb',
                img: null
            });
        }

        var url = 'https://api.thetvdb.com/series/' + id + '/images/query';
        var imbase = 'http://thetvdb.com/banners/';
        var opts = {
            json: true,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + TvdbApiKey
            }
        };

        function tvCall(key, name) {
            return new Promise(function(resol) {
                var ret = {};
                ret[name] = null;

                return got(url + '?keyType=' + key, opts).then(function(res) {
                    var i = res.body;
                    if (i && i.data && i.data[0]) {
                        ret[name] = imbase + i.data[0].fileName;
                    }
                    return resol(ret);
                }).catch(function(err) {
                    return resol(ret);
                });
            });
        };

        return Promise.all([tvCall('fanart', 'background'), tvCall('poster', 'poster')])
            .then(function(responses) {
                var obj = {};
                obj[Object.keys(responses[0])[0]] = responses[0][Object.keys(responses[0])[0]];
                obj[Object.keys(responses[1])[0]] = responses[1][Object.keys(responses[1])[0]];
                return resolve({
                    source: 'tvdb',
                    img: obj
                });
            }).catch(function(err) {
                return resolve({
                    source: 'tvdb',
                    img: null
                });
            });
    });
};

var parseItem = function (input) {
    var output = {};

    // check if it's a trakt object
    if (input.ids) {
        if (input.ids.imdb !== undefined && (input.ids.tmdb !== undefined || input.ids.tvdb !== undefined)) {
            for (var i in input.ids) {
                if (i.indexOf('imdb') !== -1) output.imdb = input.ids[i];
                if (i.indexOf('tvdb') !== -1) output.tvdb = input.ids[i];
                if (i.indexOf('tmdb') !== -1) output.tmdb = input.ids[i];
            }
        }
    }

    for (var i in input) {
        if (input[i]) {
            if (i.indexOf('imdb') !== -1) output.imdb = input[i];
            if (i.indexOf('tvdb') !== -1) output.tvdb = input[i];
            if (i.indexOf('tmdb') !== -1) output.tmdb = input[i];
            if (i.indexOf('type') !== -1 && input[i]) {
                output.type = input[i].indexOf('movie') !== -1 ? 'movie' : 'show';
            }
            if (!output.imdb && !output.tvdb && !output.tvdb) {
                if (i === 'id' && input[i]) {
                    output.id = input[i];
                }
            }
        }
    }
    return output;
};

var getMovie = function (item) {
    return Promise.all([
        getFanart(item.imdb, item.type),
        getOmdb(item.imdb, item.type),
        getTmdb(item.tmdb)
    ]).then(function(obj) {
        return format(obj);
    });
};

var getShow = function (item) {
    return Promise.all([
        getFanart(item.tvdb, item.type),
        getOmdb(item.imdb, item.type),
        getTvdb(item.tvdb)
    ]).then(function(obj) {
        return format(obj);
    });
};

var notFound = function () {
    return new Promise(function (resolve) {
        resolve({
            poster: null,
            background: null
        });
    });
};

Images.get = function(input) {
    var item = parseItem(input);

    if (item.type && (item.imdb || item.tvdb || item.tmdb)) {
        if (item.type === 'movie') {
            return getMovie(item);
        } else {
            return getShow(item);
        }
    } else if (item.imdb || item.tvdb || item.tmdb || item.id) {
        var id_type;
        if (item.id) {
            id_type = item.id.toString().indexOf('tt') !== -1 ? 'imdb' : 'tvdb';
        } else {
            id_type = item.imdb ? 'imdb' : item.tvdb ? 'tvdb' : item.tmdb ? 'tmdb' : false;
        }

        if (!id_type) {
            Trakt._debug('Image retrieval failed for: ' + JSON.stringify(input));
            return notFound();
        }

        return Trakt.search.id({
            id_type: id_type,
            id: item[id_type] || item.id
        }).then(function(res) {
            if (res[0] && res[0].type === 'movie') {
                return getMovie({
                    imdb: res[0].movie.ids.imdb,
                    tmdb: res[0].movie.ids.tmdb,
                    type: 'movie'
                });
            } else {
                return getShow({
                    imdb: res[0].show.ids.imdb,
                    tvdb: res[0].show.ids.tvdb
                });
            }
        }).catch(function (err) {
            return notFound();
        });
    } else {
        Trakt._debug('Image retrieval failed for: ' + JSON.stringify(input));
        return notFound();
    }
};