'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;

  // For security purposes only merge these parameters
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.displayName = user.firstName + ' ' + user.lastName;
  user.roles = req.body.roles;

  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;

  user.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  User.find({}, '-salt -password -providerData').sort('-created').populate('user', 'displayName').exec(function (err, users) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(users);
  });
};

/**
 * updateUserRole
 * @param req
 * @param res
 */
exports.updateUserRole = function (req, res) {
  var user = req.model;

  user.update({
    $set: {roles: req.body.userRole}
  }).exec(function (err, result) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      user.roles = req.body.userRole;
      res.json(user);
    }
  });
};

/**
 * updateUserStatus
 * @param req
 * @param res
 */
exports.updateUserStatus = function (req, res) {
  var user = req.model;

  user.update({
    $set: {status: req.body.userStatus}
  }).exec(function (err, result) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      user.status = req.body.userStatus;
      res.json(user);
    }
  });
};

/**
 * updateUserScore
 * @param req
 * @param res
 */
exports.updateUserScore = function (req, res) {
  var user = req.model;

  user.score = user.score + parseInt(req.body.userScore, 10);
  if (user.score < 0) {
    user.score = 0;
  }
  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * updateUserUploaded
 * @param req
 * @param res
 */
exports.updateUserUploaded = function (req, res) {
  var user = req.model;

  user.uploaded = user.uploaded + parseInt(req.body.userUploaded, 10);
  if (user.uploaded < 0) {
    user.uploaded = 0;
  }
  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * updateUserDownloaded
 * @param req
 * @param res
 */
exports.updateUserDownloaded = function (req, res) {
  var user = req.model;

  user.downloaded = user.downloaded + parseInt(req.body.userDownloaded, 10);
  if (user.downloaded < 0) {
    user.downloaded = 0;
  }
  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(user);
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'User is invalid'
    });
  }

  User.findById(id, '-salt -password -providerData').exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = user;
    next();
  });
};
