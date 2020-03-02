
const express = require('express')
const router = express.Router()

const checkLogin = require('../../middlewares/check').checkLogin
const PostModel = require('../../models/posts')
const CommentModel = require('../../models/comments')

router.get('/', function (req, res, next) {

    res.render('manager/manage')

  })

module.exports = router
