const mongoCollections = require("./mongoCollection");
const Users = mongoCollections.Users;
const uuidv4 = require('uuid/v4');
const bcrypt = require("bcrypt");
const saltRounds = 16;

module.exports = {

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


		}

	// completeTask : async function(taskId) {

	// 	    if (!taskId) throw "You must provide an task id to search for";

	// 	    const UserCollection = await Users();

	// 	    const task = await this.getUser(taskId);

	// 	  	let updatedTask = {
	// 	        //_id: taskId,
	// 		    title: task.title,
	// 		    description: task.description,
	// 		    completed: true,
	// 		    completedAt: true
	// 	    };

	// 	    const updateInfo = await UserCollection.updateOne({ _id: taskId }, updatedTask);
	// 	    if (updateInfo.modifiedCount === 0) {
	// 	      throw "could not update task successfully";
	// 	    }

	// 	    return await this.getUser(taskId);
	// 	},

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