const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const exphbs = require("express-handlebars");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const static = express.static(__dirname + "/public");
const UserFunctions = require("./dbFunctions");
//const connection = require("./mongoConnection");
let xss = require("xss");
app.use("/public", static);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// async function getAll(){
// 	console.log("\n\nGetting All Users: \n\n")
// 	const usersFromDB = await UserFunctions.getAllUsers();
// 	// let hashVal = await bcrypt.compare("menon","$2b$16$wNqA/VRvHcQobflglhqxOeTz26ppJUZ07NJgBs9F7PAcpEf1UHHQW")
// 	// console.log(hashVal);
// 	console.log(usersFromDB);
// }

app.use("/dashboard", function (req, res, next) {
	// If we had a user system, we could check to see if we could access /admin

	// console.log(
	// 	"Middleware Fired"
	// );

	if (req.cookies.AuthCookie) {
		next();
	}
	else {
		let hasErrors = true;
		let errors = [];
		errors.push("no user is logged in");
		res.status(403).render(__dirname + "/homepage", { "hasErrors": hasErrors, "errors": errors });
		return;
	}
});


app.post("/login", async (req, res) => {

	//console.log("username : ", req.body.username);
	//console.log("password: ", req.body.password);

	if (req.body.username.length == 0 || req.body.password.length == 0) {
		let hasErrors = true;
		let errors = [];
		errors.push("username/Password is empty");
		res.status(400).render(__dirname + "/homepage", { "hasErrors": hasErrors, "errors": errors });
		return;
	}

	let hashedPass;
	let userId;
	//console.log("Going inside loop")
	const usersFromDB = await UserFunctions.getAllUsers();
	let isUser = false;
	for (let i = 0; i < usersFromDB.length; i++) {
		//console.log(usersFromDB[i].username)
		if (req.body.username == usersFromDB[i].username) {
			isUser = true;
			hashedPass = usersFromDB[i].hashedPassword;
			userId = usersFromDB[i]._id;
		}
	}
	if (!isUser) {
		let hasErrors = true;
		let errors = [];
		errors.push("User does not exists..!!\nPlease Sign Up");
		res.status(400).render(__dirname + "/homepage", { "hasErrors": hasErrors, "errors": errors });
		return;
	}
	//console.log("Fetched From DB: ", hashedPass);

	let comparedVal = await bcrypt.compare(req.body.password, hashedPass);
	//console.log("comparedVal", comparedVal)

	if (comparedVal) {
		res.cookie("AuthCookie", userId);
		//res.render(__dirname + "/data", {"nameOfTheCourse":nameOfTheCourse, "lastName":lastName, "bio": bio, "profession": profession});
		res.redirect("/dashboard");
	}
	else {
		let hasErrors = true;
		let errors = [];
		errors.push("username/password does not match");
		res.status(403).render(__dirname + "/homepage", { "hasErrors": hasErrors, "errors": errors });
		return;
	}

})

app.get("/signup", (req, res) => {
	res.render(__dirname + "/signup");
})

app.post("/signup", async (req, res) => {
	try {
		//console.log("\nEntered Information: ", req.body);
		const usersFromDB = await UserFunctions.getAllUsers();

		for (let i = 0; i < usersFromDB.length; i++) {
			if (req.body.username == usersFromDB[i].username) {
				let hasErrors = true;
				let errors = [];
				errors.push("Username already exists..!!");
				res.status(400).render(__dirname + "/signup", { "hasErrors": hasErrors, "errors": errors });
				return;
			}
			if (req.body.email == usersFromDB[i].email) {
				let hasErrors = true;
				let errors = [];
				errors.push("Email already exists..!!");
				res.status(400).render(__dirname + "/signup", { "hasErrors": hasErrors, "errors": errors });
				return;
			}
		}
		let createdUser = await UserFunctions.createUser(req.body.username, req.body.password, req.body.email, req.body.course);
		//console.log(createdUser);
		res.redirect("/");
	} catch (error) {
		console.log(error);
		res.send(error)
	}
})

app.get("/addCourseForm", async (req, res) => {
	res.render(__dirname + "/addACourse");
})

app.post("/addACourse", async (req, res) => {
	//console.log("\n\nComing inside the POST route with data ", req.body)
	let user = await UserFunctions.addCourse(req.cookies.AuthCookie, req.body.course)
	if (user == false) {
		res.render(__dirname + "/addACourse", { alreadyStudent: true });
	} else {
		//console.log("\n\nAfter Updating : ", user);
		res.redirect("/");
	}
})

app.get("/removeCourseForm", async (req, res) => {
	res.render(__dirname + "/removeACourse");
})

app.post("/removeCourse", async (req, res) => {
	let user = await UserFunctions.removeCourse(req.cookies.AuthCookie, req.body.course)
	//console.log("\n\nAfter Updating : ", user);
	res.redirect("/");
})

app.get("/removeCourseFormTut", async (req, res) => {
	res.render(__dirname + "/removeACourseAsTut");
})

app.post("/removeCourseAsTut", async (req, res) => {
	let user = await UserFunctions.removeCourseAsTut(req.cookies.AuthCookie, req.body.course)
	//console.log("\n\nAfter Updating : ", user);
	res.redirect("/");
})

app.get("/dashboard", async (req, res) => {
	//console.log("Inside the route /dashboard")
	const usersFromDB = await UserFunctions.getAllUsers();
	//console.log("\n\nAuthCookie Value : ", req.cookies.AuthCookie);
	let currentUser = await UserFunctions.getUser(req.cookies.AuthCookie)
	// console.log("Fetched User",currentUser);
	//console.log("\nCurrent User: \n", currentUser)
	//let testObj = {"nameOfTheCourse":currentUser.courses[0], "profession": currentUser.email};

	let newObj = {
		"isTutor": currentUser.tutor,
		"courses": currentUser.courses,
		"tutorAt": currentUser.tutorAt
	}

	//console.log("\n\nDashboard Object Values: \n", newObj)

	res.render(__dirname + "/data", newObj);
})

app.get("/becomeATutor", async (req, res) => {
	res.render(__dirname + "/becomeTutor");
})

app.post("/becomeATutor", async (req, res) => {
	//console.log("Coming inside /becomeATutor with data\n", req.body)
	let user = await UserFunctions.becomeTutor(req.cookies.AuthCookie, req.body.course)
	if (user == false) {
		res.render(__dirname + '/becomeTutor', { alreadyStudent: true });
	} else {
		//console.log(user);
		res.redirect("/");
	}
})
//
app.post("/viewTutorRequests", async (req, res) => {
	//console.log("\n\n\nComing inside view tutor requests with the following data: \n\n", req.body)
	let activeRequests = await UserFunctions.getActiveRequests(req.body.course, req.cookies.AuthCookie);
	//console.log("\n\nComing back to the route with data: \n\n", activeRequests);
	let requests = [];
	for (let i = 0; i < activeRequests.length; i++) {
		requests[i] = activeRequests[i];
	}
	//console.log("requests"+requests)
	res.render(__dirname + "/TutorRequests", { "requests": requests });
})

app.post("/acceptedRequest", async (req, res) => {
	//console.log("Coming inside post addARequest with data: \n", req.body.requestId)
	req.body.acceptedBy = req.cookies.AuthCookie;
	//console.log("Coming inside post addARequest with data: \n", req.body);
	req.body.acceptedAt = Date();
	let editReq = await UserFunctions.editReqAfterAccepted(req.body);
	//console.log("editReq (1 for Success/0 for failure): ", editReq);
	res.redirect("/viewTutorRequests");
})

app.post("/myAcceptedRequests", async (req, res) => {
	let AcceptedRequests = await UserFunctions.myAcceptedRequests(req.cookies.AuthCookie);
	//console.log("AcceptedRequests: ", AcceptedRequests);
	res.render(__dirname + "/myAcceptedRequests", { "AcceptedRequests": AcceptedRequests });
})

app.post("/rejectedRequest", async (req, res) => {
	//console.log("Coming inside post addARequest with data: \n", req.body.requestId)
	req.body.rejectedBy = req.cookies.AuthCookie;
	//console.log("Coming inside post addARequest with data: \n", req.body);
	req.body.rejectedAt = Date();
	let editReq = await UserFunctions.editReqAfterRejected(req.body);
	//console.log("editReq (1 for Success/0 for failure): ", editReq);
	res.redirect("/viewTutorRequests");
})


app.get("/logout", async (req, res) => {
	res.clearCookie("AuthCookie");
	res.render(__dirname + "/logout");
})

app.get("/", async (req, res) => {
	//console.log("\nInside the base route")
	if (req.cookies.AuthCookie) {

		//console.log("Cookie found")
		res.redirect("/dashboard");
	}
	else {
		//console.log("No Cookie found")
		//console.log(usersFromDB);
		//getAll();
		res.render(__dirname + "/homepage");
	}
})

app.get("/addARequest", async (req, res) => {
	//console.log("\n\n\nCOMING INSIDE ADD A REQUEST\n\n\n", req.body)
	res.render(__dirname + "/addRequest")
})

app.post("/addARequest", async (req, res) => {
	req.body.requestBy = req.cookies.AuthCookie;
	//console.log("Coming inside post addARequest with data: \n", req.body);
	req.body.acceptedBy = [];
	req.body.rejectedBy = [];
	req.body.postedAt = Date();
	req.body.status = "OPEN";
	let createdReq = await UserFunctions.createReq(req.body);
	//console.log("createdReq (1 for Success/0 for failure): ", createdReq);
	res.redirect("/dashboard")
})

app.get("/viewActiveRequests", async (req, res) => {
	let myRequests = await UserFunctions.getMyRequests(req.cookies.AuthCookie);
	//console.log("\n\n\nMy Active Requests: ", myRequests, "\n\n\n");
	let hasRequests = true;
	let requests = [];
	for (let i = 0; i < myRequests.length; i++) {
		requests.push(myRequests[i]);
	}
	res.render(__dirname + "/ActiveRequests", { "hasRequests": hasRequests, "requests": requests });
})

app.post("/viewRequestAsStudent", async (req, res) => {
	//console.log(req.body.viewRequest)
	let viewRequest = await UserFunctions.viewRequest(req.body.viewRequest);
	//console.log("\n\n\nMy Active Requests: ", viewRequest, "\n\n\n");
	//let hasRequests = true;
	let requests = [];
	for (let i = 0; i < viewRequest.length; i++) {
		requests.push(viewRequest[i]);
	}
	res.render(__dirname + "/viewRequest", { "requests": requests });
})

app.get("*", async (req, res) => {
	//console.log("\nInside the * route\n")
	if (req.cookies.AuthCookie) {
		res.redirect("/dashboard");
	}
	else {
		res.render(__dirname + "/homepage");
	}
})

app.listen(3000, () => {
	console.log("Pendikan is now live!");
	console.log("Your routes will be running on http://localhost:3000");
	if (process && process.send) process.send({ done: true });
});