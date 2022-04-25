const jwt = require('jsonwebtoken')
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 4500;
const cors = require('cors');
const mongoose = require('mongoose')
app.use(cors())

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json());
// Mongoose
const URI = process.env.MONGOS_URI
mongoose.connect(URI, (err)=> {
    {!err ? console.log("Connected Successfully") : console.log(err);}
})

mongoose.Promise = global.Promise;
let userSchema = mongoose.Schema({
    firstname:{
        type: String,
        require:true
    },
    lastname:{
        type: String,
        require:true
    },
    phone_number: {
        type: String,
        default: '',
        unique: true
    },
    password: {
        type: String,
        require:true
    },
    gender: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    account_no: {
        type: String,
        require:true,
        unique: true
    },
    bvn: {
        type: String,
        default: '',
        unique: true
    },
    verified_acc: {
        type: Boolean,
        require: true,
        default: false
    }
})
userSchema.pre('save', async function (next){
    let {password} =this;
    const saltRound = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(password, saltRound);
    next();
})
let userModel = mongoose.model("users_db", userSchema);

app.post('/signup', (req,res) =>{
    let {firstname, lastname, email, password} = req.body 
    const accountNo = Math.floor(10000000000 + Math.random() * 90000000000)
    let signup = new userModel({ firstname, lastname, email, password, accountNo, })
    signup.save((err) => {
        if (!err) {
            res.json({message: "Signed up successfully"})
        } else if (err) {
            if (err.keyPattern.email == 1) {
                res.json({message: "Email already existed"})
            } else if (err.keyPattern.accountNo == 1) {
                accountNo = Math.floor(10000000000 + Math.random() * 90000000000)
            } else {
                res.json({message: err})
            }
        }
    })
})

app.post('/signin', (req,res)=>{
    let loginContent = req.body;
    userModel.findOne({email:loginContent.email}, async (err,result)=>{
        // let users = result;
        // let found = users.find((element, i) => element.email == loginContent.email)
        if (result) {
            console.log(result);
            let email = result.email
            let validPassword = await bcrypt.compare(loginContent.password, result.password)
            if(validPassword){
                jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '1h', issuer: "localhost:3000"}, (err, token)=>{
                console.log(token);
                res.json({message:"Login Succesfully" ,token, status: true})
            })
            } else {
                res.json({message: "Incorrect Password", status: false})
            }
        }  else {
            res.json({message: "Email not registered", success:false})
        }
    })
})

app.get('/loadDashboard', (req,res)=>{
    console.log(req.headers.authorization);
    let token = req.headers.authorization.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET,(err, decoded)=>{
        if(err){
            console.log('Token no gree verify');
            console.log(err);
        } else {
            if (decoded) {
                console.log(decoded);
            }
        }
    })
})

app.get('/', (req, res)=>{
    res.send('Hello World')
})

app.listen(PORT, ()=>{
    console.log(`You are connected to port ${PORT}`);
})