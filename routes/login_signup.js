var express = require('express');
var router = express.Router();
var bcrypt=require('bcrypt');
var db=require('../db.js');
var passport=require('passport');
var expressValidators=require('express-validator');
var cookieParser=require('cookie-parser');
var bodyParser=require('body-parser');
var jsonParser= bodyParser.json();
var LocalStrategy = require('passport-local').Strategy;
const saltRounds = 10;
var urlencodedParser=bodyParser.urlencoded({extended:false});
var path=require('path');

var multer = require('multer');
var async = require("async");

var http = require("http");

var nodemailer = require("nodemailer");

//MULTER
const storage = multer.diskStorage({
  destination : 'public/uploads/',
  filename : function(req,file,cb){
    cb(null,file.originalname + '-' + Date.now() + path.extname(file.originalname))
  }
})

//MULTER FOR PROFILE PICTURE
const storage1 = multer.diskStorage({
  destination : 'public/uploads/',
  filename : function(req,file,cb){
    cb(null,req.user.userid +  path.extname(file.originalname))
  }
})


//INITIALIZE UPLOAD
const upload = multer({
  storage: storage,
  limits:{fileSize : 10000000},
  fileFilter : function(req,file,cb){
    checkFileType(file,cb);
  }
}).single('myImage')

//MULTER FOR PROFILE PICTURE
const upload1 = multer({
  storage: storage1,
  limits:{fileSize : 10000000},
  fileFilter : function(req,file,cb){
    checkFileType(file,cb);
  }
}).single('myImage')

//CHECK FILE TYPE
function checkFileType(file,cb){
  // Allowed extname
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|zip/
  // check extname
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  }else{
    cb('Error : Images,pdf,doc file  Only');
  }


}

function checkFileType1(file,cb){
  // Allowed extname
  const filetypes = /jpeg|jpg|png/
  // check extname
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  //check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  }else{
    cb('Error : Images,pdf,doc file  Only');
  }


}

//PROFILE PAGE
router.get('/profile/:userid',authenticationMiddleware(),function(req,res){

  db.query('SELECT userid,location,full_name,email,branch,b_year from users where userid=?',[req.user.userid],function(error,results,fields){
    if(error){
      throw error;
    }else{

      console.log(results);
      res.render('profile',{user : results});

    }
  })




})
//PROFILE PAGE IMAGE UPLOAD
router.post('/profile/:userid',(req,res) => {
  upload1(req,res,(err) => {
    console.log(req.user);
    if(err){
      //  throw error;
      res.render('profile',{msg : err ,user : req.user});
      //res.render('/profile/'+req.params.userid,{msg : err})
    }else{
      if(req.file == undefined){
        res.render('profile',{msg : 'No file selected ',user : req.user});
        //  res.render('/profile/'+req.params.userid,{msg : 'Error : No file selected'});
      }else{
        console.log(req.file);
        console.log(req.body);
        var location=req.file.path;
        var ret = location.replace('public/','');

        //  var id=req.user.userid;
        //  var description=req.body.description;
        //  var location=req.file.path;
        //var ret = location.replace('public/','');
        db.query('update users set location=? where userid=?',[ret,req.user.userid],function(error,results,fields){


          if(error){
            throw error;
          }else{

            return res.redirect('/profile/'+req.params.userid);
          }

        })

      }


    }



  })



})




//FILE UPLOAD
router.post('/upload',(req,res) => {
  upload(req,res,(err) => {
    console.log(req.user);
    if(err){
      res.render('home',{msg : err});
    }else{
      if(req.file == undefined){

        db.query('select location from users where userid=?',[req.user.userid],function(error,result,fields){
          res.render('home',{msg : 'no file selected ',img:result[0].location,user:req.user});
        })
      }else{
        console.log(req.file);

        console.log(req.body);
        var id=req.user.userid;
        var description=req.body.description;
        var location=req.file.path;
        var ret = location.replace('public/','');

        var b_year = req.body.year;
        var branch=req.body.branch;
        console.log(id);
        console.log(description);
        console.log(location);
        console.log(b_year);
        console.log(branch);
        db.query('INSERT INTO uploads (user_id,description,location,b_year,branch) VALUES (?,?,?,?,?)',[id,description,ret,b_year,branch],function(error,results,fields){
          if(error){
            throw error;
          }
        })

        db.query('SELECT email from users where b_year=? and branch=? and want_noti="yes"',[b_year,branch],function(error,results,fields){

          if(error){
            throw error;
          }else{
            console.log(results);


            //MAIL PORTION



            var listofemails=[];
            for(var i=0;i<results.length;i++){
              listofemails.push(results[i].email);
            }

            var success_email = [];

            var failure_email = [];

            var transporter;



            function massMailer() {
              var self = this;
              transporter = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                  user: "leavemanageriiti@gmail.com",
                  pass: "qwerty1234@"
                }
              });


              self.invokeOperation();
            };



            massMailer.prototype.invokeOperation = function() {
              var self = this;
              async.each(listofemails,self.SendEmail,function(){
                console.log(success_email);
                console.log(failure_email);
              });
            }





            massMailer.prototype.SendEmail = function(Email,callback) {
              console.log("Sending email to " + Email);
              var self = this;
              self.status = false;
              async.waterfall([
                function(callback) {
                  var mailOptions = {
                    from: 'leavemanageriiti@gmail.com',
                    to: Email,
                    subject: req.user.full_name+' has added a file ',
                    //text: "Hello World !"
                    html: '<h1>file added</h1><h3>now you can download</h3>'
                  };
                  transporter.sendMail(mailOptions, function(error, info) {
                    if(error) {
                      console.log(error)
                      failure_email.push(Email);
                    } else {
                      self.status = true;
                      success_email.push(Email);
                    }
                    callback(null,self.status,Email);
                  });
                },
                function(statusCode,Email,callback) {
                  console.log("Will update DB here for " + Email + "With " + statusCode);
                  callback();
                }
              ],function(){

                callback();
              });
            }

            new massMailer();

          }


        })
        db.query('select location from users where userid=?',[req.user.userid],function(error,result,fields){
          res.render('home',{msg : 'File uploaded ',img:result[0].location,user:req.user});
        })

      }
    }
  })



})



//INITIAL HOME
router.get('/initial_home',authenticationMiddleware(),function(req,res){

  db.query('select * from users where userid=?',[req.user.userid],function(error,results,fields){

    if(error){
      throw error;
    }else{
      console.log(results);
      db.query('select * from users where branch=? and b_year =?',[results[0].branch,results[0].b_year],function(error,results1,fields){
        if(error){
          throw error;
        }
        console.log(results1);

        console.log(results[0].location);
        res.render('initial_home',{user : req.user,img: results[0].location,results : results1});
      })



    }


  })


})

router.get('/r_download/uploads/:path',authenticationMiddleware(),function(req,res){

  var path = req.params.path;
  var path1=__dirname+'/../public/uploads/'+path;
  res.download(path1);
})
//DOWNLOADS SELECT
router.get('/downloads',authenticationMiddleware(),function(req,res){
  db.query('select location from users where userid=?',[req.user.userid],function(error,result,fields){
console.log(result);
    res.render('year.ejs',{img:result[0].location,user:req.user});
  })


})
router.post('/downloads',function(req,res){
  var year = req.body.year;
  var branch = req.body.branch;
  //  console.log(year);
  //console.log(branch);

  return  res.redirect('/downloads/'+year+'/'+branch);
  //return  res.redirect('/downloads/year/branch/');


})
router.get('/downloads/:year/:branch/',authenticationMiddleware(),function(req,res){

  var year = req.params.year
  var branch = req.params.branch;
  db.query('SELECT * FROM uploads WHERE b_year=? and branch=?',[year,branch],function(error,results,fields){

    db.query('select location from users where userid=?',[req.user.userid],function(error,result,fields){
  console.log(result);
    //  res.render('home.ejs',{img:result[0].location,user:req.user});
    res.render('d_view.ejs',{arr : results,img:result[0].location,user:req.user});
    })
    //  console.log(results[0].location);
  })

})


//AFTER SUCCESSFUL LOGIN
router.get('/home',authenticationMiddleware(),function(req,res,next){
  console.log(req.user);
  console.log(req.isAuthenticated());
  if(!req.isAuthenticated()){
    return res.redirect('/');
  }
  else{

    db.query('select location from users where userid=?',[req.user.userid],function(error,result,fields){
  console.log(result);
      res.render('home.ejs',{img:result[0].location,user:req.user});
    })
  }

})

// logout

router.get('/logout',function(req,res){
  req.logout();
  req.session.destroy();
  return res.redirect('/');

})


/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    res.redirect('/initial_home');
    }
    else {

      res.render('login_signup', { title: 'Express' ,errors:[""]});
    }
});

router.post('/signup',urlencodedParser,function(req,res){

  req.checkBody('sign_up_input', 'Username field cannot be empty.').notEmpty();
  req.checkBody('sign_up_input', 'Username must be between 4-15 characters long.').len(4, 15);
  req.checkBody('sign_up_email', 'email field cannot be empty.').notEmpty();
  req.checkBody('sign_up_email', 'The email you entered is invalid, please try again.').isEmail();
  req.checkBody('sign_up_email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
  req.checkBody('sign_up_password', 'Password must be between 4-100 characters long.').len(4, 100);
  req.checkBody('sign_up_repassword', 'confirm Password must be between 4-100 characters long.').len(4, 100);
  //req.checkBody('sign_up_repassword', 'Passwords do not match, please try again.').equals(req.body.sign_up_password);

  const error=req.validationErrors();
  if(error){
    console.log(error);
    res.render('login_signup',{errors:error});
  }
  else{
    var username=req.body.sign_up_input;


    var email=req.body.sign_up_email;

    var password=req.body.sign_up_password;
    var year=req.body.sign_up_year;
    var branch=req.body.sign_up_branch;
    var check;
    if(req.body.check == undefined){
      check='no';
    }else{

      check='yes';
    }
    var today = new Date();

    bcrypt.hash(password,saltRounds,function(err,hash){
      var users={
        "full_name":username,
        "email":email,
        "password":hash,
        "created":today,
        "modified":today,
        "want_noti":check,
        "branch":branch,
        "b_year":year
      }
      db.query('select * from users where email=?',[email],function(error,result,fields){
        if(error)throw error;console.log(1);
        if(result.length>0){

          var x=[{msg:'user name already exist , try another'}];
          res.render('login_signup',{errors:x});
        }
        else{
          db.query('insert into users set ?',users,function(err,result){
            if(err){throw err}
            else{
              db.query('select userid,full_name from users where  email=?',[email],function(error,result,fields){
                if(error)throw error;

                var user=result[0];

                req.login(user,function(err){
                  if(err)console.log(err);
                  console.log(req.user);
                  res.redirect('/initial_home');
                })// need to give authorisation
              })
            }
            //res.send(user_name);


          })
        }
      })
    })
  }
})

router.post('/login',function(req,res){
  ///console.log(req.body);
  req.checkBody('sign_in_input', 'Enter user name').notEmpty();
  var error=req.validationErrors();
  if(error){
    res.render('login_signup',{errors:error});
  }
  var email=req.body.sign_in_input;
  var password=req.body.password;
  db.query('select userid,full_name from users where email=? ',[email],function(error,result,fields){
    if(result.length>0){
      var user=result[0];
      db.query('select password from users where email=?',[email],function(error,result,fields){
        var hash=result[0].password;
        bcrypt.compare(password,hash,function(err,response){
          if(response===true){
            req.login(user,function(err){
              res.redirect('/downloads');
            })
          }
          else{
            res.render('login_signup',{errors:[{msg:'wrong password'}]});
          }
        })
      })

    }else{

      res.render('login_signup',{errors:[{msg:'email id not found'}]});
    }
  })




})

// passport.use('local',new LocalStrategy(
//
//
//   function(username, password, done) {
//     //console.log(username);
//     console.log(password);
//
//       return done(null,true);
//   }
// ));

passport.serializeUser(function(user_id, done) {
  done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
  done(null,user_id);


});
function authenticationMiddleware () {
  return (req, res, next) => {
    console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }
}
module.exports = router;
