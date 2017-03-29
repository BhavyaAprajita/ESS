var express = require("express"),
	app		= express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport 	  = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	randomstring = require("randomstring"),
	Application = require("./models/application"),
	User = require("./models/user"),
	middleware = require("./middleware");


var multer = require("multer");
var upload = multer({dest: "./uploads"});
var fs = require("fs");

var Grid = require("gridfs-stream");
Grid.mongo = mongoose.mongo;

mongoose.connect("mongodb://localhost/studentsportal");
var conn = mongoose.connection;

gfs = Grid(conn.db);

var port = process.env.PORT || 3030;


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "anything",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});


//ROoT ROUTE
app.get("/", function(req, res){
	res.render("landing");
	console.log(req.get("host"));
});


//render registration form
app.get("/register", function(req, res){
	res.render("register");
});


//register route
app.post("/register", upload.single("avatar"), function(req, res){
   console.log(req.body);
	if(req.body.password === req.body.confirm_password){
        if(req.body.mobile.length === 10){	
            var pl = req.body.username.toLowerCase().replace(' ', '').replace(/[^\w\s]/gi, '').trim();
            var token = randomstring.generate({
                            length: 64
                            });
            var newUser = new User({
                name: req.body.name, 
                email: req.body.email, 
                mobile: req.body.mobile, 
                username: req.body.username,
                course: req.body.course,
                branch: req.body.branch,
                semester: req.body.semester,
                admission_no: req.body.admission_no,

                permalink: pl,
                verify_token: token
                 });

            	User.register(newUser, req.body.password, function(err, user){
			        if(err){
			            console.log(err);
			            req.flash("error", err.message);
			            res.redirect("/register");
			        } else {

			        	fname = user._id + ".jpg";
						//create a gridfs-stream into which we pipe multer's temporary file saved in uploads. After which we delete multer's temp file.
						var writestream = gfs.createWriteStream({
						   filename: fname
						});
						//
						//pipe multer's temp file /uploads/filename into the stream we created above. On end deletes the temporary file.
						fs.createReadStream("./uploads/" + req.file.filename)
						    .on("end", function(){
						      	fs.unlink("./uploads/"+ req.file.filename, function(err){
							})})
						        .on("err", function(){res.send("Error uploading image")})
						          .pipe(writestream);

			        	sendVerification(newUser.email, pl, token);
			        	passport.authenticate("local")(req, res, function(){
			           		req.flash("success", "Welcome to EStudentsPortal " + user.username + "! Please Verify your email address!");
			            	res.redirect("/profile");
			            	});
			        }	
			    });
			}
			else {
				req.flash("error", "Please enter a valid mobile nnumber");
				res.redirect("back");
				}
    } else {
        req.flash("error", "Password and Confirm Password doesn't match");
        res.redirect("back");
    }
});


// Profile route
app.get("/profile", middleware.isLoggedIn, function(req, res){
	res.render("profile");
});

//Render edit profile page
app.get("/profile/edit", middleware.isLoggedIn, function(req, res){
	res.render("edit");
});

//UPDATE Profile ROUTE
app.put("/profile", middleware.isLoggedIn, function(req, res){
    if(req.body.user.mobile.length === 10){
        User.findByIdAndUpdate(req.user.id, req.body.user, function(err, updatedUser){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Profile Updated");
                res.redirect("/profile");
            }
        });
    } else {
        req.flash("error", "Please enter a valid mobile number");
        res.redirect("back");
    }
	
});

//render login form
app.get("/login", function(req, res){
	res.render("login");
});

//Login Route
app.post("/login",  passport.authenticate("local",
	{	
		successFlash: true,
		successRedirect: "/profile",
		failureRedirect: "/login",
		failureFlash: true
	}), function(req, res){
	
});

//Logout route
app.get("/logout", function(request, response){
  request.logout();
  request.flash("success", "Successfully logged out")
  response.redirect("/");
});

//Show Applications Route
app.get("/application/index", middleware.isLoggedIn, function(req, res){
	Application.find({'applicant': req.user.id}, function(err, found){
		if(err){
			req.flash("error", err);
			res.redirect("back");
		} else {
			console.log(found);
			res.render("show", {applications: found});
		}
	});

});

// render Application form
app.get("/application/new", middleware.isLoggedIn, function(req, res){
	res.render("newApplication");
});

//new application
app.post("/application/new", middleware.isLoggedIn, upload.single("avatar"), function(req, res, next){
	console.log("POST Route");
	

	var type = req.body.type;
	var reason = req.body.reason;
	var name = req.body.name;
	var fathername = req.body.fathername;
	var course = req.body.course;
	var branch = req.body.branch;
	var semester = req.body.semester;
	var rollno = req.body.rollno;
	var	applicant = req.user._id;

	var newApplication = { type: type, reason: reason, name: name, fathername: fathername, course: course,
						branch: branch, semester:semester, rollno: rollno, applicant: applicant}
   	
	Application.create(newApplication, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else {
			console.log(newlyCreated);
			fname = newlyCreated._id + ".jpg";
			//create a gridfs-stream into which we pipe multer's temporary file saved in uploads. After which we delete multer's temp file.
		    var writestream = gfs.createWriteStream({
		      filename: fname
		    });
		    //
		    // //pipe multer's temp file /uploads/filename into the stream we created above. On end deletes the temporary file.
		    fs.createReadStream("./uploads/" + req.file.filename)
		      .on("end", function(){
		      	fs.unlink("./uploads/"+ req.file.filename, function(err){
		      	
		      })})
		        .on("err", function(){res.send("Error uploading image")})
		          .pipe(writestream);

		        User.findById(newlyCreated.applicant, function(err, found){
		        	if(err){
		        		req.flash("error", err);
		        		res.redirect("back");
		        	} else {
		        		link = req.get("host") + "/" + newlyCreated._id + ".jpg";
				        message = newlyCreated + " applicant : "+ found + " No dues slip : " + link;
				        middleware.sendMail("rajesh.vbn@gmail.com", message);
				        req.flash("success", "Application successfuly submitted");
				        res.redirect("/profile");
		        	}
		      });
		}
	});

    
});

// ===========================
// About Route
// ===========================

app.get("/about", function(req, res){
	res.render("about");
});

app.get("/help", function(req, res){
	res.render("help");
});

// send verification mail
var sendVerification = function(email,  permalink, token){
    link="http://localhost:8080/verify/"+permalink+"/"+token;
    message= "Welcome to bookLEgacy. Please click on the link to verify your email address " + link;
    middleware.sendMail(email, message);
}

//verify email
app.get('/verify/:permaink/:token', function (req, res) {
        var permalink = req.params.permaink;
        var token = req.params.token;

        User.findOne({'permalink': permalink}, function (err, user) {
            if (user.verify_token == token) {
                console.log('that token is correct! Verify the user');
                req.flash("success", "Email Verified! Please log-in to continue")
                User.findOneAndUpdate({'permalink': permalink }, {'verified': true}, function (err, resp) {
                    console.log('The user has been verified!');
                });

                res.redirect('/login');
            } else {
                console.log('The token is wrong! Reject the user. token should be: ' + user.local.verify_token);
            }
        });
});

  // sends the image we saved by filename.
app.get("/:filename", function(req, res){
      var readstream = gfs.createReadStream({filename: req.params.filename});
      readstream.on("error", function(err){
        res.send("No image found with that title");
      });
      readstream.pipe(res);
});

//Start the server
app.listen(port, process.env.IP, function(){
	console.log("Server" started at port :" + port");
});