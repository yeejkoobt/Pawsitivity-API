var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

/**
 * Names of the collection in the database
 */
var USERS_COLLECTION = "pawsitivity-users";

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = database;
    console.log("Database connection ready");

    // Initialize the app.
    var server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// CONTACTS API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});

}

app.get("/", function(req, res) {
    res.send("Welcome to Pawsitivity API!");
});

/**  "/users"
 *    GET: finds all users
 *    POST: creates a new user
 */

app.get("/users", function(req, res) {
    db.collection(USERS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get users.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post("/users", function(req, res) {
    var newGame = req.body;
    newGame.createDate = new Date();

    if (!(req.body.username ||
        req.body.password)) {
        handleError(res,
            "Invalid user input",
            "Must provide a username and password.", 400);
    }

    db.collection(USERS_COLLECTION).insertOne(newGame, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new user.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

/**  "/users/:id"
 *    GET: find user by username and password; if the user exists, then we pass a true value, but if not, then we
 *    pass a false value back to the requester
 *    PUT: update user by id
 *    DELETE: deletes user by id
 */

app.get("/users/:username/:password", function(req, res) {
    db.collection(CONTACTS_COLLECTION).findOne({ username: new ObjectID(req.params.username),
            password: new ObjectID(req.params.password, {_id: 0}) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get user");
            // res.status(200).json(doc);
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put("/users/:id", function(req, res) {
    var updateDoc = req.body;
    delete updateDoc._id;

    db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to update contact");
        } else {
            res.status(204).end();
        }
    });
});

app.delete("/users/:id", function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete contact");
        } else {
            res.status(204).end();
        }
    });
});


/**  "/users/delete"
 *    DELETE: deletes all users in the database
 */

app.delete("/users/delete", function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteMany({}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete all documents in the database");
        } else {
            res.status(204).send("Successfully deleted all documents in the database. Double check the database" +
                " for confirmation.").end();

        }
    });
});