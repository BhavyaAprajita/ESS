var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	name: String,
	admission_no: String,
	email: String,
	mobile: String,
	course: String,
	branch: String,
	semester: String,
	permalink: String,
	verify_token: String,
	verfied: {
		type: Boolean,
		default: false
	}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);