const express = require('express');
const bodyParser = require("body-parser");
const https = require('https');
const fs = require('fs');
const {v4 : uuidv4} = require("uuid");
const port = 443;
const app = express(0);
const {createClient} = require('redis');
const md5 = require('md5');

const redisClient = createClient(
    {
    Url:`redis://default:${process.env.REDIS_PASS}@redis-stedi-elijah:6379`,
    }
);

app.use(bodyParser.json());

https.createServer({
    key: fs.readFileSync('./SSL/server.key'),
    cert: fs.readFileSync('./SSL/server.cert'),
    ca: fs.readFileSync('./SSL/chain.pem'),
}, app).listen(port, async () => {
    await redisClient.connect();
    console.log('Listening...')
});
// app.listen(port, async ()=>{
//     console.log('listening on port'+port);
    
// });

app.get('/', (req,res)=>{
    res.send('Hello World')
});

app.post('/user', (req, res)=>{
    const newUserRequestObject = req.body;
    console.log('New User:',JSON.stringify(newUserRequestObject));
    redisClient.hSet('users',req.body.email,JSON.stringify(newUserRequestObject));
    res.send('New user'+newUserRequestObject.email+'added');
});

// redis-cli
// ./signup.cmd

app.post("/login",async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = req.body.password;
    console.log("loginPassword", loginPassword);
    // res.send("Who are you");

    const userString=await redisClient.hGet('users',loginEmail);
    const userObject=JSON.parse(userString)
    if(userString=='' || userString==null) {
        res.status(404);
        res.send('User not found');
    }
    else if (loginEmail == userObject.userName && loginPassword == userObject.password){
        const token = uuidv4();
        res.send(token);
    } else{
        res.status(401);//unauthorized
        res.send("Invalid user or password");
    }
})