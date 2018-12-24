const mongoCollections = require("./mongoCollection");
const connection = require("./mongoConnection");

const dbFunction = require("./dbFunctions")


async function createUser(username, password, email, course){
    try{
        await dbFunction.createUser(username, password, email, course)
    }
    catch(e){
        const db = await connection();
        await db.serverConfig.close();
        throw e;
    }
    console.log("Done seeding user");
}

async function createRequest(requestObj){
    try{
        await dbFunction.createReq(requestObj)
    }
    catch(e){
        const db = await connection();
        await db.serverConfig.close();
        throw e;
    }
    console.log("Done seeding request");
}

async function becomeTutor(id, course){
    try{
        await dbFunction.becomeTutor(id,course)
    }
    catch(e){
        const db = await connection();
        await db.serverConfig.close();
        throw e;
    }
    console.log("Done seeding Tutor ");
}

async function main(){
    try{
    let stu1UserName = "Student1";
    let stu1Password = "Student1";
    let stu1Email = "student1@stevens.edu";
    let stu1Course = "CS546";
    await createUser(stu1UserName,stu1Password,stu1Email,stu1Course);

    let stu2UserName = "Student2";
    let stu2Password = "Student2";
    let stu2Email = "student2@stevens.edu";
    let stu2Course = "CS570";
    await createUser(stu2UserName,stu2Password,stu2Email,stu2Course);

    let stu1ID = await dbFunction.getUserID(stu1UserName);
    let stu2ID = await dbFunction.getUserID(stu2UserName);
    //console.log(stu1ID+"\n"+stu2ID)
    await becomeTutor(stu1ID,stu2Course);
    await becomeTutor(stu2ID,stu1Course);

    let requestObj = {
        course: "CS570",
        topic: "Link State Routing",
        description: "Graph Data structure implementation",
        time: "2019-02-02T15:02",
        location: "Library",
        requestBy: stu1ID,
        acceptedBy: [],
        rejectedBy: [],
        postedAt: "Fri Dec 14 2018 12:39:48 GMT-0500 (Eastern Standard Time)",
        status: "OPEN",
        rejectedAt: null,
        acceptedAt: null,
    }
    await createRequest(requestObj);

    let requestObj1 = {
        course: "CS546",
        topic: "XSS",
        description: "XSS implementation",
        time: "2019-01-02T15:02",
        location: "Babio",
        requestBy: stu2ID,
        acceptedBy: [],
        rejectedBy: [],
        postedAt: "Fri Dec 14 2018 01:39:48 GMT-0500 (Eastern Standard Time)",
        status: "OPEN",
        rejectedAt: null,
        acceptedAt: null,
    }
    await createRequest(requestObj1);
    }catch(e){
        const db = await connection();
        await db.serverConfig.close();
        throw e;
    }
    finally{
        const db = await connection();
        await db.serverConfig.close();
    }
}
main();