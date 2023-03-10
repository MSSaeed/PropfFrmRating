const route = require("express").Router();
const { default: axios } = require("axios");
const User = require("../db/models/users");
const jsonwebtoken = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const url = require('url')


const transporter = nodemailer.createTransport({
  service: "gmail",
  secure:true,
  auth: {
    user: 'custmerg476@gmail.com',
    pass: "xjgmmgsipkvezxaf",
  },
});

route.post("/signup", (req, resp) => {
  originalUrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    // pathname: req.originalUrl,
  })
  const token = jsonwebtoken.sign(
    {
      data: req.body,
    },
    "ourSecretKey",
    { expiresIn: "10m" }
  );
  const mailConfigurations = {
    // It should be a string of sender/server email
    from: "custmerg476@gmail.com",
  
    to: req.body.user_email,
  
    // Subject of Email
    subject: "Email Verification",
  
    // This would be the text of email body
    text: `Hi! There, You have recently visited 
             our website and entered your email.
             Please follow the given link to verify your email
             ${originalUrl}/verify/${token}
             Thanks`,
  };
  transporter.sendMail(mailConfigurations, function (error, info) {
    if (error){
        throw Error(error);
  }else{    
  }
  });
  resp.json({success:true})
});

route.get('/verify/:token([a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_.+/=]*)', (req, res)=>{
  const token = req.params.token;
  // Verifying the JWT token 
  jsonwebtoken.verify(token, 'ourSecretKey',async function(err, decoded) {
      if (err) {
          res.send("Email verification failed, possibly the link is invalid or expired");
      }
      else {
          let user = new User(decoded.data);
          await user.save();
          let log = User.findOne({user_name:decoded.data.user_name})
          if(log){
            res.json({
              success: true,
              user:log
            });
          }
      }
  });
});




route.post("/login", async (req, resp) => {
  let user = await User.findOne(req.body);
  if (user) {
    jsonwebtoken.sign({ id: user._id }, "cat says miooon in FSD", {
        expiresIn: "1d"
    }, function (err, Token) {
        resp.json({
            success:true,
            user,
            token: Token
        });
    })
  }
});

route.get("/get-users", async (req, resp) => {
  let users = await User.find();
  resp.json(users);
});

route.post("/google-login", async (req, res) => {
  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" +
      req.body.access_token
  );
  let user = await User.findOne({ user_email: data.email });
  if (user) {
      jsonwebtoken.sign({ id: user._id }, "cat says miooon in FSD", {
          expiresIn: "1d"
      }, function (err, Token) {

          res.json({
              success:true,
              user,
              token: Token
          });
      })
  } else {
    const user = new User({
      user_picture: data.picture,
      user_name: data.name,
      user_email: data.email,
      user_password: data.id,
      user_reviews: [],
    });
    await user.save();
    User.findOne({ user_name: data.name }, (err, user) => {
      if (user) {
        jsonwebtoken.sign({ id: user._id }, "cat says miooon in FSD", {
            expiresIn: "1h"
        }, function (err, Token) {

            res.json({
                success:true,
                user,
                token: Token
            });
        })
    }
    });
  }
});

route.post('/check-session', (req, res) => {
  jsonwebtoken.verify(req.body.token, "cat says miooon in FSD", async (err, data) => {
      let user = await User.findById(data.id);
      res.json({user});
  })

});



route.delete("/delete-user", async (req, resp) => {
  await User.findByIdAndDelete(req.query.id);
  resp.json({ success: true });
});


module.exports = route;
