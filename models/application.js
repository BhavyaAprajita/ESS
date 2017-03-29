var mongoose = require("mongoose");
var applicationSchema = new mongoose.Schema({
	type: String,
	reason: String,
	name: String,
	fathername: String,
	course: String,
	branch: String,
	semester: String,
	rollno: String,
	applicant: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	submitted: {type: Date, default: Date.now}

});

module.exports = mongoose.model("Application", applicationSchema);