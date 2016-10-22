var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

/**
 * Names of the collection in the database
 */
var GAMES_COLLECTION = "games";

var app = express();
app.use(bodyParser.json());

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
    res.send("Welcome to GameOn: Ping, Add, Play's REST API");
});

/**  "/games"
 *    GET: finds all games
 *    POST: creates a new game
 */

app.get("/games", function(req, res) {
    db.collection(GAMES_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get games.");
        } else {
            res.status(200).json(docs);
        }
    });
});

app.post("/games", function(req, res) {
    var newGame = req.body;
    newGame.createDate = new Date();

    if (!(req.body.hostName ||
        req.body.gameLocation ||
        req.body.numOfPlayers ||
        req.body.dateOfGame ||
        req.body.timeOfGame)) {
        handleError(res,
            "Invalid user input",
            "Must provide a hostName, gameLocation, numOfPlayers, dateOfGame, and timeOfGame.", 400);
    }

    db.collection(GAMES_COLLECTION).insertOne(newGame, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to create new game.");
        } else {
            res.status(201).json(doc.ops[0]);
        }
    });
});

/**  "/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/contacts/:id", function(req, res) {
    db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get contact");
        } else {
            res.status(200).json(doc);
        }
    });
});

app.put("/contacts/:id", function(req, res) {
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

app.delete("/contacts/:id", function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete contact");
        } else {
            res.status(204).end();
        }
    });
});


/**  "/games/delete"
 *    DELETE: deletes all games in the database
 */

app.delete("/games/delete", function(req, res) {
    db.collection(CONTACTS_COLLECTION).deleteMany({}, function(err, result) {
        if (err) {
            handleError(res, err.message, "Failed to delete all documents in the database");
        } else {
            res.status(204).send("Successfully deleted all documents in the database. Double check the database" +
                " for confirmation.").end();

        }
    });
});