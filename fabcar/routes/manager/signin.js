const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../../models/manager')
const checkNotLogin = require('../../middlewares/check').checkNotLogin

// GET /signin 登录页
router.get('/', checkNotLogin, function (req, res, next) {
  res.render('managersignin')
})

// POST /signin 用户登录
router.post('/', checkNotLogin, function (req, res, next) {
  const name = req.fields.name
  const password = req.fields.password

  // 校验参数
  try {
    if (!name.length) {
      throw new Error('請輸入帳號')
    }
    if (!password.length) {
      throw new Error('請輸入密碼')
    }
  } catch (e) {
    req.flash('error', e.message)
    return res.redirect('back')
  }

  UserModel.getUserByName(name)
    .then(function (user) {
      if (!user) {
        req.flash('error', '此帳號不存在')
        return res.redirect('back')
      }
      // 检查密码是否匹配
      if (sha1(password) !== user.password) {
        req.flash('error', '帳號或密碼輸入錯誤')
        return res.redirect('back')
      }
      req.flash('success', '登入成功')
      // 用户信息写入 session
      delete user.password
      req.session.manager = user
      // 跳转到主页
      res.redirect('manage')
    })
    .catch(next)
})

router.post('/app', checkNotLogin, function (req, res) {
  const name = req.fields.name
  const password = req.fields.password

  const LoginStatus = {
    status: 1, //0成功1失敗
    msg: ""
  }

  // 校验参数
  try {
    if (!name.length) {
      throw new Error('請輸入帳號')
    }
    if (!password.length) {
      throw new Error('請輸入密碼')
    }
  } catch (e) {
    LoginStatus.status = 1
    LoginStatus.msg = e.message
    res.json(LoginStatus)
  }

  UserModel.getUserByName(name)
    .then(function (user) {
      if (!user) {
        LoginStatus.status = 1
        LoginStatus.msg = '此帳號不存在'
        res.json(LoginStatus)
      }
      // 检查密码是否匹配
      if (sha1(password) !== user.password) {
        LoginStatus.status = 1
        LoginStatus.msg = '帳號或密碼輸入錯誤'
        res.json(LoginStatus)
      }

      // 用户信息写入 session
      delete user.password
      req.session.manager = user
      
      LoginStatus.status = 0
      LoginStatus.msg = '登入成功'
      res.json(LoginStatus)
    })
})

module.exports = router
