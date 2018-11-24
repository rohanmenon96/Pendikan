const mongoCollections = require("./mongoCollection");
const toDo = mongoCollections.todoItems;
const uuidv4 = require('uuid/v4');
module.exports = {

	getTask : async function(id) {
	    if (!id) throw "You must provide an id to search for";

	    const toDoCollection = await toDo();
	    const task = await toDoCollection.findOne({ _id: id });
	    if (task === null) throw "No dog with that id";

	    return task;
  		},

	createTask : async function(title, description)
		{
			if (!title) throw "You must provide a title";

		    if (!description)
		      throw "You must provide a description";

		    const toDoCollection = await toDo();

		    let newTask = {
		        _id: uuidv4(),
			    title: title,
			    description: description,
			    completed: false,
			    completedAt: null
		    };

		    const insertInfo = await toDoCollection.insertOne(newTask);
		    if (insertInfo.insertedCount === 0) throw "Could not add task";

		    const newId = insertInfo.insertedId;

		    const task = await this.getTask(newId);
		    return task;
		},

	getAllTasks : async function (){

		    const toDoCollection = await toDo();

		    const tasks = await toDoCollection.find({}).toArray();

		    return tasks;


		},

	completeTask : async function(taskId) {

		    if (!taskId) throw "You must provide an task id to search for";

		    const toDoCollection = await toDo();

		    const task = await this.getTask(taskId);

		  	let updatedTask = {
		        //_id: taskId,
			    title: task.title,
			    description: task.description,
			    completed: true,
			    completedAt: true
		    };

		    const updateInfo = await toDoCollection.updateOne({ _id: taskId }, updatedTask);
		    if (updateInfo.modifiedCount === 0) {
		      throw "could not update task successfully";
		    }

		    return await this.getTask(taskId);
		},

	removeTask : async function(id) {
		    if (!id) throw "You must provide an id to search for to remove";

		    const toDoCollection = await toDo();
		    const deletionInfo = await toDoCollection.removeOne({ _id: id });

		    if (deletionInfo.deletedCount === 0) {
		      throw `Could not delete task with id of ${id}`;
		    }

		    return true;
		}

}