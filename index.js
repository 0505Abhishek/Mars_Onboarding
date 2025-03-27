const express = require("express");
const session = require('express-session');

require('dotenv').config();

const path = require('path');
const app = express();

const cookieParser = require('cookie-parser');

const adminRoute = require("./src/routes");
const port = process.env.PORT;



app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));



app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Set custom Server header
  res.set('Server', 'Sachin');
  res.locals.alert = req.session.alert || null; // Handle alert session
  req.session.alert = null; 
  
  next();
});



app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'src/views'));


app.use(cookieParser());
// app.use(logger('dev'));
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));



let multipart = require('connect-multiparty')();
app.use(function(req, res, next){
  if(req.headers && req.headers['content-type'] && req.headers['content-type'].indexOf("multipart") >= 0){
    multipart(req, res, next);
  }else{
    let parser= express.json({limit: '100mb', extended: true });
    parser(req, res, next)
  }
});

app.use(express.static(path.join(__dirname, "src/public")));

app.use('/public', express.static(__dirname + '/src/public'));


app.use('/', adminRoute);
app.use((req, res) => {

  res.redirect('/page404/page404'); 
});
app.listen(3100, () => {

  console.log(`listening on port 3100`);
});