const mongoCollections = require("./mongoCollection");
const Users = mongoCollections.Users;
const Requests = mongoCollections.Requests;
const uuidv4 = require('uuid/v4');
const bcrypt = require("bcrypt");
const saltRounds = 16;

module.exports = {

	createReq: async function (reqObject) {
		reqObject._id = uuidv4();
		//reqObject.acctedBy = [];
		console.log("Coming inside createReq with data: \n", reqObject);
		let RequestCollection = await Requests();
		let insertInfo = await RequestCollection.insertOne(reqObject);
		return insertInfo.insertedCount;
	},

	editReqAfterAccepted: async function (reqObject) {
		let requestCollection = await Requests();
		let request = await requestCollection.find({ _id: reqObject.requestId }).toArray();
		console.log("Request::" + JSON.stringify(request));
		if (request === null) throw "No request found";
		console.log(typeof (request[0].acceptedBy));
		request[0].acceptedBy.push(reqObject.acceptedBy);
		let updateInfo = await requestCollection.updateOne({ _id: reqObject.requestId }, { $set: { "acceptedBy": request[0].acceptedBy, 'acceptedAt': reqObject.acceptedAt } })
		return updateInfo.updatedCount;
	},

	editReqAfterRejected: async function (reqObject) {
		let requestCollection = await Requests();
		let request = await requestCollection.find({ _id: reqObject.requestId }).toArray();
		//console.log("Request::"+JSON.stringify(request));
		if (request === null) throw "No request found";
		//console.log(typeof(request[0].rejectedBy));
		request[0].rejectedBy.push(reqObject.rejectedBy);
		let updateInfo = await requestCollection.updateOne({ _id: reqObject.requestId }, { $set: { "rejectedBy": request[0].rejectedBy, 'rejectedAt': reqObject.rejectedAt } })
		return updateInfo.updatedCount;
	},
	getUser: async function (id) {
		if (!id) throw "You must provide an id to search for";

		const UserCollection = await Users();
		const user = await UserCollection.findOne({ _id: id });
		if (user === null) throw "No user with that id";

		return user;
	},

	createUser: async function (username, password, email, course) {
		if (!username) throw "You must provide a Username";

		if (!password)
			throw "You must provide a password";

		const UserCollection = await Users();
		const hashedPassword = await bcrypt.hash(password, saltRounds)

		let newUser = {
			_id: uuidv4(),
			username: username,
			password: password,
			hashedPassword: hashedPassword,
			email: email,
			courses: [course],
			tutor: false,
			tutorAt: []
		};

		const insertInfo = await UserCollection.insertOne(newUser);
		if (insertInfo.insertedCount === 0) throw "Could not add user";

		const newId = insertInfo.insertedId;

		const addedUser = await this.getUser(newId);
		return addedUser;
	},

	getAllUsers: async function () {

		const UserCollection = await Users();

		const users = await UserCollection.find({}).toArray();

		return users;
	},

	getMyRequests: async function (userID) {
		const RequestCollection = await Requests();
		return await RequestCollection.find({ requestBy: userID }).toArray();
	},

	viewRequest: async function (requestID) {
		const RequestCollection = await Requests();
		let request = await RequestCollection.find({ _id: requestID }).toArray();
		delete request.rejectedBy;
		delete request.rejectedAt;
		return request;
	},

	getActiveRequests: async function (courseName, tutId) {
		const RequestCollection = await Requests();
		let answer = await RequestCollection.find({ $and: [{ course: courseName }, { status: "OPEN" }] }).toArray();
		//console.log("\n\nReturning Requests: \n\n", answer);
		console.log("tutId:" + tutId)
		//console.log("tutId:"+typeof(tutId))
		for (let request in answer) {
			accByArr = answer[request].acceptedBy;
			for (let i in accByArr) {
				if (accByArr[i] == tutId) {
					console.log("inIFaccccc:" + accByArr[i])
					console.log("reNumber" + request);
					answer.splice(request, 1);
				}
			}
		}
		for (let req in answer) {
			rejByArr = answer[req].rejectedBy;
			for (let i in rejByArr) {
				if (rejByArr[i] == tutId) {
					console.log("inIFreeeeeee:" + rejByArr[i])
					console.log("rejreqNum" + req);
					answer.splice(req, 1);
				}
			}
		}
		console.log(answer);
		return answer;
	},

	addCourse: async function (userID, courseName) {
		if (!userID) throw "You must provide an user id to search for";

		const UserCollection = await Users();
		const user = await this.getUser(userID);
		let courseArr = user.courses;
		let tutCourseArr = user.tutorAt;
		let isPresentTut = false;
		for (let course in tutCourseArr) {
			if (tutCourseArr[course] == courseName) {
				isPresentTut = true;
				break;
			}
		}

		let isPresent = false;
		for (let course in courseArr) {
			if (courseArr[course] == courseName) {
				isPresent = true;
				break;
			}
		}
		if (isPresent || isPresentTut) {
			//console.log("if");
			return false;
		}
		else {
			//console.log("else")
			let courseArray = user.courses;
			courseArray.push(courseName);
			console.log("course" + courseArray);
			console.log("course" + typeof (courseArray));
			console.log("course" + typeof (user.courses));
			await UserCollection.updateOne({ _id: userID }, { $set: { "courses": courseArray } });
		}


		return await this.getUser(userID);
	},

	becomeTutor: async function (userID, courseName) {

		if (!userID) throw "You must provide an user id to search for";

		const UserCollection = await Users();
		const user = await this.getUser(userID);
		let courseArr = user.courses;
		let tutCourseArr = user.tutorAt;
		let isPresentTut = false;
		for (let course in tutCourseArr) {
			if (tutCourseArr[course] == courseName) {
				isPresentTut = true;
				break;
			}
		}

		let isPresent = false;
		for (let course in courseArr) {
			if (courseArr[course] == courseName) {
				isPresent = true;
				break;
			}
		}
		if (isPresent || isPresentTut) {
			//console.log("if");
			return false;
		}
		else {
			//console.log("else")
			let courseArray = user.tutorAt;
			courseArray.push(courseName);
			console.log("course" + courseArray);
			console.log("course" + typeof (courseArray));
			console.log("course" + typeof (user.tutorAt));
			await UserCollection.updateOne({ _id: userID }, { $set: { "tutor": true, "tutorAt": courseArray } });
		}
		return await this.getUser(userID);
	},
	removeCourse: async function (userID, courseName) {

		const UserCollection = await Users();
		const user = await this.getUser(userID);
		let courseArray = user.courses;
		let isremoved = false;
		for (let course in courseArray) {
			if (courseArray[course] == courseName) {
				courseArray.splice(course, 1);
				isremoved = true;
			}
		}
		if (!isremoved) {
			return "There is no course to remove with that name..!!";
		}
		const updateInfo = await UserCollection.updateOne({ _id: userID }, { $set: { "courses": courseArray } });
		if (updateInfo.modifiedCount === 0) {
			throw "could not update task successfully";
		}
		return await this.getUser(userID);
	},
	removeCourseAsTut: async function (userID, courseName) {

		const UserCollection = await Users();
		const user = await this.getUser(userID);
		let courseArray = user.tutorAt;
		let isremoved = false;
		for (let course in courseArray) {
			if (courseArray[course] == courseName) {
				courseArray.splice(course, 1);
				isremoved = true;
			}
		}
		if (!isremoved) {
			return "There is no course to remove with that name..!!";
		}
		const updateInfo = await UserCollection.updateOne({ _id: userID }, { $set: { "tutorAt": courseArray } });
		if (updateInfo.modifiedCount === 0) {
			throw "could not update task successfully";
		}
		return await this.getUser(userID);
	}
	// removeTask : async function(id) {
	// 	    if (!id) throw "You must provide an id to search for to remove";

	// 	    const UserCollection = await Users();
	// 	    const deletionInfo = await UserCollection.removeOne({ _id: id });

	// 	    if (deletionInfo.deletedCount === 0) {
	// 	      throw `Could not delete task with id of ${id}`;
	// 	    }

	// 	    return true;
	// 	}

}
