const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const exphbs = require("express-handlebars");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const static = express.static(__dirname + "/public");
app.use("/public", static);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

let users = [
		{
				"userId" : "1",  // use MongoDB unique ID

				"username" : "masterdetective123",

				"nameOfTheCourse" : "CS 546",

				"profession" : "Student",

				"password" : "elementarymydearwatson",

				"hashedPassword" : "$2a$16$7JKSiEmoP3GNDSalogqgPu0sUbwder7CAN/5wnvCWe6xCKAKwlTD."
		}
];

app.use("/dashboard", function(req, res, next) {
  // If we had a user system, we could check to see if we could access /admin

  console.log(
    "Middleware Fired"
  );

  	if(req.cookies.AuthCookie)
			{
				next();
			}
		else
			{
				let hasErrors = true;
				let errors = [];
				errors.push("no user is logged in");
				res.status(403).render(__dirname + "/homepage", {"hasErrors":hasErrors, "errors":errors});
				return;
			}
});


app.get("/",async(req,res)=>{
	if(req.cookies.AuthCookie)
		{
			res.redirect("/dashboard");
		}
	else
	{
	res.render(__dirname + "/homepage");
	}
})

app.post("/login",async (req,res)=>{

	console.log("username : ",req.body.username);
	console.log("password: ",req.body.password);
	
	if(req.body.username.length==0 || req.body.password.length==0)
		{
			let hasErrors = true;
			let errors = [];
			errors.push("username/Password is empty");
			res.status(400).render(__dirname + "/homepage", {"hasErrors":hasErrors, "errors":errors});
			return;
		}

	let hashedPass ; 
	let userId ;

	for(let i=0; i<users.length; i++)
		{
			if(req.body.username==users[i].username)
				{
					hashedPass = users[i].hashedPassword;
					userId = users[i].userId;
				}
		}

	console.log(hashedPass);

	let comparedVal = await bcrypt.compare(req.body.password, hashedPass);
	console.log("comparedVal", comparedVal)

	if(comparedVal)
			{
				res.cookie("AuthCookie", userId);
				//res.render(__dirname + "/data", {"nameOfTheCourse":nameOfTheCourse, "lastName":lastName, "bio": bio, "profession": profession});
				res.redirect("/dashboard");
			}
	else
			{
				let hasErrors = true;
				let errors = [];
				errors.push("username/Password does not match");
				res.status(403).render(__dirname + "/homepage", {"hasErrors":hasErrors, "errors":errors});
				return;
			}
 
})

app.get("/dashboard",async(req,res)=>{
				for(let i=0; i<users.length; i++)
					{
						if(req.cookies.AuthCookie == users[i].userId)
							{
								res.render(__dirname + "/data", {"nameOfTheCourse":users[i].nameOfTheCourse, "profession": users[i].profession});
							}
					}
	})


app.get("/logout",async(req,res)=>{
	res.clearCookie("AuthCookie");
	res.render(__dirname + "/logout");
})

app.get("*",async(req,res)=>{
	if(req.cookies.AuthCookie)
		{
			res.redirect("/dashboard");
		}
	else
	{
	res.render(__dirname + "/homepage");
	}
})

app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:3000");
   if (process && process.send) process.send({done: true}); // ADD THIS LINE
});