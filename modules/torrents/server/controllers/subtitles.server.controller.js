'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  fs = require('fs'),
  User = mongoose.model('User'),
  Torrent = mongoose.model('Torrent'),
  Subtitle = mongoose.model('Subtitle'),
  async = require('async');

/**
 * create a subtitle of torrent
 * @param req
 * @param res
 */
exports.create = function (req, res) {
  var user = req.user;
  var createUploadSubtitleFilename = require(path.resolve('./config/lib/multer')).createUploadSubtitleFilename;
  var getUploadSubtitleDestination = require(path.resolve('./config/lib/multer')).getUploadSubtitleDestination;
  var fileFilter = require(path.resolve('./config/lib/multer')).subtitleFileFilter;

  var storage = multer.diskStorage({
    destination: getUploadSubtitleDestination,
    filename: createUploadSubtitleFilename
  });

  var upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: config.uploads.subtitle.file.limits
  }).single('newSubtitleFile');

  if (user) {
    uploadFile()
      .then(function () {
        var torrent = req.torrent;
        var newfile = config.uploads.subtitle.file.dest + req.file.filename;
        var stat = fs.statSync(newfile);
        var subfile = new Subtitle();

        subfile.user = req.user;
        subfile.torrent = req.torrent._id;
        subfile.subtitle_filename = req.file.filename;
        subfile.subtitle_filesize = stat.size;

        subfile.save();

        //torrent.update({
        //  $addToSet: {_subtitles: subfile}
        //}).exec();

        torrent._subtitles.push(subfile);

        torrent.save(function (err) {
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          } else {
            Torrent.populate(torrent._subtitles, {
              path: 'user',
              select: 'displayName profileImageURL uploaded downloaded'
            }, function (err, t) {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                res.status(200).send(torrent);
                return;
              }
            });
          }
        });
      })
      .catch(function (err) {
        res.status(422).send({
          message: err
        });
      });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }

  function uploadFile() {
    return new Promise(function (resolve, reject) {
      upload(req, res, function (uploadError) {
        if (uploadError) {
          console.log(uploadError);
          var message = errorHandler.getErrorMessage(uploadError);

          if (uploadError.code === 'LIMIT_FILE_SIZE') {
            message = 'Subtitle file too large. Maximum size allowed is ' + (config.uploads.subtitle.file.limits.fileSize / (1024 * 1024)).toFixed(2) + ' Mb files.';
          }
          reject(message);
        } else {
          resolve();
        }
      });
    });
  }
};

/**
 * delete a subtitle of torrent
 * @param req
 * @param res
 */
exports.delete = function (req, res) {
  var torrent = req.torrent;

  torrent._subtitles.forEach(function (r) {
    if (r._id.equals(req.params.subtitleId)) {
      //torrent.update({
      //  $pull: {_subtitles: r._id}
      //}).exec();
      torrent._subtitles.pull(r._id);

      r.remove();
      res.json(torrent);
    }
  });
};

/**
 * download a subtitle
 * @param req
 * @param res
 */
exports.download = function (req, res) {
  var torrent = req.torrent;

  torrent._subtitles.forEach(function (r) {
    if (r._id.equals(req.params.subtitleId)) {
      var filePath = config.uploads.subtitle.file.dest + r.subtitle_filename;

      fs.exists(filePath, function (exists) {
        if (exists) {
          var stat = fs.statSync(filePath);

          try {
            //res.set('Content-Type', 'application/x-bittorrent');
            res.set('Content-Disposition', 'attachment; filename=' + r.subtitle_filename);
            res.set('Content-Length', stat.size);

            fs.createReadStream(filePath).pipe(res);
          } catch (err) {
            res.status(422).send({
              message: 'DOWNLOAD_FAILED'
            });
          }
        } else {
          res.status(422).send({
            message: 'FILE_DOES_NOT_EXISTS'
          });
        }
      });
    }
  });
};
