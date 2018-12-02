const mongoCollections = require("./mongoCollection");
const Users = mongoCollections.Users;
const Requests = mongoCollections.Requests;
const uuidv4 = require('uuid/v4');
const bcrypt = require("bcrypt");
const saltRounds = 16;

module.exports = {

	createReq: async function(reqObject){
		reqObject._id = uuidv4();
		console.log("Coming inside createReq with data: \n", reqObject);
		let RequestCollection = await Requests();
		let insertInfo = await RequestCollection.insertOne(reqObject);
		return insertInfo.insertedCount;
	},

	getUser : async function(id) {
	    if (!id) throw "You must provide an id to search for";

	    const UserCollection = await Users();
	    const user = await UserCollection.findOne({ _id: id });
	    if (user === null) throw "No user with that id";

	    return user;
  		},

	createUser : async function(username, password,email,course)
		{
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

	getAllUsers : async function (){

		    const UserCollection = await Users();

		    const users = await UserCollection.find({}).toArray();

		    return users;


		},

	respondRequest: async function(tutorId,RequestId,action){

		const RequestCollection = await Requests();
		const UserCollection = await Users();

		let data = await RequestCollection.findOne({_id: RequestId});

		let newRepBy = data.repliedBy;
		newRepBy.push(tutorId);
		let updateInfo = await RequestCollection.updateOne({_id : RequestId},{$set: {repliedBy : newRepBy}}); 

		return await RequestCollection.findOne({_id: RequestId}); 

	},
	
	myAcceptedRequests: async function(tutorID){
		const RequestCollection = await Requests();
		return await RequestCollection.find({repliedBy: tutorID}).toArray();
	},

	getMyRequests : async function(userID){
		const RequestCollection = await Requests();
		return await RequestCollection.find({requestBy : userID}).toArray();
	},

	getActiveRequests: async function(courseName){
		const RequestCollection = await Requests();
		let answer = await RequestCollection.find({$and: [{course: courseName},{status: "OPEN"}]}).toArray();
		console.log("\n\nReturning Requests: \n\n", answer);
		return answer;
	},

	addCourse: async function(userID,courseName){
		const UserCollection = await Users();
		const user = await this.getUser(userID);
		let courseArray = user.courses;
		courseArray.push(courseName);
		const updateInfo = await UserCollection.updateOne({ _id: userID }, {$set: { "courses": courseArray}});
		if (updateInfo.modifiedCount === 0) {
			throw "could not update task successfully";
		  }
		return await this.getUser(userID);
	},

	becomeTutor : async function(userID,course) {

		    if (!userID) throw "You must provide an user id to search for";

		    const UserCollection = await Users();

			const user = await this.getUser(userID);
			let courseArray = user.tutorAt;
			courseArray.push(course);

		  	// let updatedTask = {
		    //     //_id: taskId,
			//     title: task.title,
			//     description: task.description,
			//     completed: true,
			//     completedAt: true
		    // };

		    const updateInfo = await UserCollection.updateOne({ _id: userID }, {$set: { "tutor" : true, "tutorAt": courseArray}});
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