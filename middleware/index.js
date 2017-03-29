var Book = require("../models/application");
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');

var middlewareObj = {};

middlewareObj.checkBookOwnership = function(req, res, next){
	if(req.isAuthenticated()){
		Book.findById(req.params.id, function(err, foundBook){
			if(err){
				req.flash("error", "Book not found");
				res.redirect("back");
			} else {
				
				if(foundBook.owner.id.equals(req.user._id)){
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
}

middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

middlewareObj.sendMail = function(mailID,  txt){
	let transporter = nodemailer.createTransport({
	   service: 'Gmail',
	   auth: {

	       type: 'OAuth2',
	       user: 'raj4115vbn@gmail.com',
	       clientId: '931633250634-6i0g5kcsf2m4gilkjdo9kqkfjqfdk7gl.apps.googleusercontent.com',
	       clientSecret: 'bXrB36bpv1Jx7k4uQ9Cqs6FW',
	       refreshToken: '1/Oz3e5oIpAItZy3T8uHnBtiHfAc2S05j5J_3MYkevfVY'
	   }  
	});




    let message = {

           to: mailID,

           subject: 'Mail from Mail Server App by Rajesh', //

           text: txt
       };
       console.log('Sending Mail');
       transporter.sendMail(message, (error, info) => {
           if (error) {
               
               console.log(error.message);
               return;
           }
           console.log('Message sent successfully!');
           // req.flash("success", "Mail Sent");
           console.log('Server responded with "%s"', info.response);
           transporter.close();
       });
}


module.exports = middlewareObj;