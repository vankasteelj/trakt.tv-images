var Images = module.exports = {}; // Skeleton
var Trakt; // the main API for trakt (npm: 'trakt.tv')
var got = require('got');
var Omdb = require('omdbapi');
var fanart = require('fanart.tv');
var Fanart = false;
var TmdbApiKey = false;
var TvdbApiKey = false;

// Initialize the module
Images.init = function(trakt) {
    Trakt = trakt;
    if (Trakt._extras.fanartApiKey) Fanart = new fanart(Trakt._extras.fanartApiKey);
    if (Trakt._extras.tmdbApiKey) TmdbApiKey = Trakt._extras.tmdbApiKey;
    if (Trakt._extras.tvdbApiKey) {
        got('https://api.thetvdb.com/login', {
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                apikey: Trakt._extras.tvdbApiKey
            })
        }).then(function(res) {
            if (res.body && res.body.token) {
                TvdbApiKey = res.body.token;
                //console.log('tvdb auth:', res.body); // DEBUG
            }
        }).catch(function(err) {
            //console.log('tvdb auth err', err); // DEBUG
        });
    };
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
        if (img && priority > background.priority) {
            background.priority = priority;
            background.url = img.background;
        }
        if (img && priority > poster.priority) {
            poster.priority = priority;
            poster.url = img.poster;
        }
    }

    return {
        background: background.url,
        poster: poster.url
    };
};

var getFanart = function(id, type) {
    return new Promise(function(resolve) {
        if (!Fanart) {
            return resolve({
                source: 'fanart',
                img: null
            });
        }

        var fanartCat = type === 'movie' ? 'movies' : 'shows';
        return Fanart[fanartCat].get(id).then(function(images) {
            //console.log('got from fanart:', images); // DEBUG

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
        var omdbCat = type === 'movie' ? 'movie' : type === 'show' ? 'series' : 'episode';
        return Omdb.get({
            id: id,
            type: omdbCat
        }).then(function(images) {
            //console.log('got from omdb:', images); // DEBUG

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
        if (!TmdbApiKey) {
            return resolve({
                source: 'tmdb',
                img: null
            });
        }

        // ditry tmdb v3 calls, because all 3rd party modules are (rightfully) bloated
        return got('https://api.themoviedb.org/3/find/' + id + '?api_key=' + TmdbApiKey + '&external_source=imdb_id', {
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            timeout: 1000
        }).then(function(res) {
            var url = 'https://image.tmdb.org/t/p/';
            var bsize = 'original'; // or w1280
            var psize = 'original'; // or w780

            var built = null;
            if (res.body) {
                //console.log('got from tmdb:', res.body); // DEBUG
                if (res.body.movie_results) {
                    if (res.body.movie_results[0]) {
                        built = {
                            background: url + bsize + res.body.movie_results[0].backdrop_path || null,
                            poster: url + psize + res.body.movie_results[0].poster_path || null,
                        };
                    }
                } else if (res.body.tv_results) {
                    if (res.body.tv_results[0]) {
                        built = {
                            background: url + bsize + res.body.tv_results[0].backdrop_path || null,
                            poster: url + psize + res.body.tv_results[0].poster_path || null,
                        }
                    }
                }
            } else {
                //console.log('NOPE')
            }

            return resolve({
                source: 'tmdb',
                img: built
            });
        }).catch(function(error) {
            //console.log('ERROR TMDB', error)
            return resolve({
                source: 'tmdb',
                img: null
            });
        });
    });
};

var getTvdb = function(id) {
    return new Promise(function(resolve) {
        if (!TvdbApiKey) {
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
                //console.log('got from tvdb', responses); // DEBUG
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

Images.get = function(id, type) {
    return Trakt.search.id({
        id_type: id.indexOf('tt') !== -1 ? 'imdb' : 'tvdb',
        id: id
    }).then(function(res) {
        //console.log('trakt response', res[0]) // DEBUG
        var imdb, tvdb, tmdb;
        if (res[0] && res[0].type === 'movie') {
            imdb = res[0].movie.ids.imdb;
            tmdb = res[0].movie.ids.tmdb;

            return Promise.all([
                getFanart(imdb, type),
                getOmdb(id, type),
                getTmdb(id)
            ]).then(function(obj) {
                //console.log('format:', obj); // DEBUG
                return format(obj);
            });
        } else {
            imdb = res[0].show.ids.imdb;
            tvdb = res[0].show.ids.tvdb;

            return Promise.all([
                getFanart(tvdb, type),
                getOmdb(imdb, type),
                getTvdb(tvdb)
            ]).then(function(obj) {
                //console.log('format:', obj); // DEBUG
                return format(obj);
            });
        }
    });
};