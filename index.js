var Images = module.exports = {}; // Skeleton
var Trakt; // the main API for trakt (npm: 'trakt.tv')
var Omdb = require('omdbapi');
var fanart = require('fanart.tv');
var Fanart = false;

// Initialize the module
Images.init = function (trakt) {
    Trakt = trakt;
    Fanart = new fanart(Trakt._extras.fanartApiKey);
};

var format = function (res) {
    return res;
};

Images.getImages = function (id, type) {
    return new Promise(function (resolve, reject) {
        console.log('passed:', id, type);
        
        var fanartCat = type === 'movie' ? 'movies' : 'shows';
        return Fanart[fanartCat].get(id).then(function (images) {
            console.log('got from fanart:', images);
            return resolve(format(images));
        }).catch(function (ferror) {
            console.log('fanart error:', ferror);
            console.log('trying omdb');
            var omdbCat = type === 'movie' ? 'movie' : type === 'show' ? 'series' : 'episode';
            return Omdb.get({
                id: id,
                type: omdbCat
            }).then(function (images) {
                return resolve(format(images));
            }).catch(function (oerror) {
                console.log('omdb error', oerror);
                return reject(new Error('fanart.tv/omdb could not match ' + id + '. Errors are: "' + ferror.message + '" and "' + oerror.message +'"'));
            });
        });
    });
};

/*

trakt.images.getImages('tt1340138', 'movie').then(console.log.bind(console)).catch(console.log.bind(console))

*/