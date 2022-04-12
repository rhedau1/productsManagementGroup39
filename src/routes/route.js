const express = require("express")
const router = express.Router();
const userController = require("../controller/userController");

router.post('/register',userController.createUser)
router.post('/login',userController.userLogin)
router.get('/user/:userId/profile',userController.getUserById)

module.exports = router