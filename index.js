const express = require('express')
const res = require('express/lib/response')
const app = express()
const port = 3000
const { User } = require("./models/User");
const bodyParser = require('body-parser');
const config = require('./config/key');
const cookieParser = require('cookie-parser');
const { auth } = require('./middleware/auth');

// application/s-www-form-urlencoded
app.use(bodyParser.urlencoded({extended : true}));
// application/json
app.use(bodyParser.json());
app.use(cookieParser()); 

const mongoose = require('mongoose')
//mongoose.connect('mongodb+srv://dong:1234@boilerplate.4k1r6l8.mongodb.net/?retryWrites=true&w=majority')
mongoose.connect(config.mongoURI, {
    //usernewUrlParser : true, useUninfiedtopology : true, useCreateIndex : true, useFindAndModify : false
}).then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))  

app.get('/', (req, res) => res.send("Hello world~~~##"))
app.post('/api/users/register', (req, res) => {
    //화원 가입할 때 필요한 정보들을 client에서 가져오면
    //그것들을 데이터 베이스에 넣어준다.
    const user = new User(req.body)

    user.save((err, userInfo) => {
        if(err) return res.json({ success : false, err})
        return res.status(200).json({
            success : true
        })
    })
})

app.post('/api/users/login', (req, res) => { 
    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({ email : req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess : false,
                messege : "제공된 이메일에 해당하는 유저가 없습니다."
            })
        }  

        //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인
        user.comparePassword(req.body.password, (err, isMach) => {
            if(!isMach)
            return res.json({loginSuccess : false, message : "비밀번호가 틀렸습니다."})

            //비밀번호까지 맞다면 토큰을 생성하기
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                //토큰을 저장한다.(쿠기, 로컬 , ...)
                res.cookie("x_auth", user.token)
                .status(200)
                .json({loginSuccess : true, userId : user._id})  

            })
        })
    })    
})

// role 1 어드민        role 2 특정부서 어드민
// role 0 일반유저       role 0이 아니면 관리자
app.get('api/users/auth', auth, (req, res) => {
    //여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 True라는 말.
    res.status(200).json({
        _id : req.user._id,
        isAdmin : req.user.role === 0 ? false : true,
        isAuth : true,
        email : req.user.email,
        name : req.user.name,
        lastname : req.user.lastname,
        role : req.user.role,
        image : req.user.image     
    })
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id : req.user._id },
    { token : ""}
    , (err, user) => {
        if(err) return res.json({ success : false, err});
        return res.status(200).send({
            success : true
        })
    })
})


app.listen(port, () => console.log('Example app listening on port ${port}!'))


