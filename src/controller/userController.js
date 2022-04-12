const userModel = require('../models/userModel')
const jwt = require("jsonwebtoken")
const aws = require("aws-sdk");
//const multer = require('multer');

const isValid = function (value) {
    if (typeof value === "undefined" || value == null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",  // id
    secretAccessKey: "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",  // secret password
    region: "ap-south-1"
});



let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {

        let s3 = new aws.S3({ apiVersion: "2006-03-01" });

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "rahul/" + file.originalname,
            Body: file.buffer,
        };

        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err });
            }
            //   console.log(data)
            //   console.log("File uploaded successfully.");
            return resolve(data.Location);
        });
    });
};



const createUser = async function (req, res) {
    try {
        let userBody = req.body
        let files = req.files
        console.log(userBody)
        //console.log(files)
        //const query = req.query
        let { fname, lname, email, phone, password, address } = userBody
        // let address = userBody.address
        // if (Object.keys(userBody) == 0) {
        //     return res.status(400).send({ status: false, msg: "please provide data in user body" })
        // }
        if (!isValidRequestBody(userBody)) {
            return res.status(400).send({ status: false, error: 'user details are missing' })
        }


        if (!isValid(fname)) {
            return res.status(400).send({ status: false, msg: "please provide  first name" })
        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, msg: "please provide  last name" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "please provide email" })
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(userBody.email))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid email" })
        }
        let duplicateEmail = await userModel.findOne({ email: userBody.email })
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: 'email already exists' })
        }
        //---------yaha par profile image ayegi-----------------

        if (!isValid(phone)) {
            return res.status(400).send({ status: false, msg: "please provide phone" })
        }
        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/
            .test(userBody.phone))) {
            return res.status(400).send({ status: false, msg: "please provide a valid phone Number" })
        }

        let duplicatePhone = await userModel.findOne({ phone: userBody.phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, msg: 'Phone already exists' })
        }
        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "please provide password" })
        }

        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(userBody.password))) {
            return res.status(400).send({ status: false, msg: "Please provide a valid password" })
        }

        if (Object.keys(address) == 0) {
            return res.status(400).send({ status: false, msg: "please provide address" });
        }
        // if (!isValidRequestBody(userBody.address)) {
        //     return res.status(400).send({ status: false, error: 'user details are missing' })
        // }

        if (!isValid(address)) {
            return res.status(400).send({ status: false, msg: "please provide  valid address" })
        }
        if (Object.keys(address.shipping) == 0) {
            return res.status(400).send({ status: false, msg: "please provide shipping address" })
        }
        if (!isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, msg: "please provide street" })
        }
        if (!isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, msg: "please provide city" })
        }
        if (!isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: "please provide pincode" })
        }
        if (Object.keys(address.billing) == 0) {
            return res.status(400).send({ status: false, msg: "please provide billing address" })
        }
        if (!isValid(address.billing.street)) {
            return res.status(400).send({ status: false, msg: "please provide street" })
        }
        if (!isValid(address.billing.city)) {
            return res.status(400).send({ status: false, msg: "please provide city" })
        }
        if (!isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: "please provide pincode" })
        }
        if (files && files.length > 0) {
            let uploadFileUrl = await uploadFile(files[0])

            let finalData = { fname, lname, email,profileImage:uploadFileUrl, phone,password, address }

            const newUser = await userModel.create(finalData)
            res.status(201).send({ status: true, msg: "user created successfully", data: finalData })
        } else {
            res.status(400).send({ msg: "no file found" })
        }

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}
//------------userLogin--------------------------

const userLogin = async function (req, res) {
    try {
        let loginBody = req.body
        let { email, password } = loginBody
        if (Object.keys(loginBody) == 0) {
            return res.status(400).send({ status: false, msg: "please provide email or password" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email is required' })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        const checkEmail = await userModel.findOne({ email: email });
        console.log(checkEmail)

        if (!checkEmail) {
            return res.status(401).send({ status: false, message: 'Invalid Email' });
        }

        const checkPassword = await userModel.findOne({ password: password })

        if (!checkPassword) {
            return res.status(401).send({ status: false, message: 'Invalid Password' });
        }
       
        let payload = { _id: user._id };
        let token = jwt.sign(payload, 'my-secret', { expiresIn: "30m" })

        return res.status(200).send({ status: true, message: 'User login successfull', token: token });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const getUserById= async function(req,res){
    try{
        UserId= req.params.createUserId

        const getUserData= await userModel.findById({_id:UserId})
        return res.status(200).send({status:true ,message: "User profile details", data: getUserData })


    }catch(err){
        console.log(err)
        res.status(500).send({status:false, message:err.message})
    }
}


module.exports.createUser = createUser
module.exports.userLogin = userLogin
module.exports.getUserById = getUserById