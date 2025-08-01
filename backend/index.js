const express = require("express")
const cors = require("cors")
const dbConnection = require("./config")
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Verification route for backend status
// app.get("/", (req, res) => {
//    res.send("SmartDecks API is running.");
// });

// ### User endpoints ###

// Retrieves all users in the database
app.get('/users', (request, response) => {
    const sqlQuery = "SELECT * FROM users;";
    dbConnection.query(sqlQuery, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Database error." });
        }
        return response.status(200).json(result);
    });
});

// Adds a user to the database
app.post('/users', (request, response) => {
    const { username, email } = request.body;
    if (!username || !email) {
        return response.status(400).json({ Error: "Username and email are required." });
    }
    const sqlQuery = "INSERT INTO users (username, email) VALUES (?, ?);";
    const values = [username, email];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to add user." });
        }
        return response.status(201).json({
            Success: "User created successfully.",
            userId: result.insertId
        });
    });
});

// Gets a specific users info
app.get('/users/:userId', (request, response) => {
    const sqlQuery = "SELECT * FROM users WHERE userId = ?";
    const values = [request.params.userId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Database error." });
        }
        return response.status(200).json(result);
    });
});

// ### Deck endpoints ###

// Lists all decks for a user
app.get('/users/:userId/decks', (request, response) => {
    const sqlQuery = "SELECT * FROM decks WHERE userId = ?";
    const values = [request.params.userId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Database error." });
        }
        return response.status(200).json(result);
    });
});

// Create a deck for a user
app.post('/users/:userId/decks', (request, response) => {
    const { name, subject } = request.body;
    if (!name) {
        return response.status(400).json({ Error: "Deck name is required." });
    }
    const sqlQuery = "INSERT INTO decks (name, subject, userId) VALUES (?, ?, ?);";
    const values = [name, subject || null, request.params.userId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to add deck." });
        }
        return response.status(201).json({ Success: "Deck created successfully." });
    });
});

// Get details for a deck
app.get('/decks/:deckId', (request, response) => {
    const sqlQuery = "SELECT * FROM decks WHERE deckId = ?";
    const values = [request.params.deckId];
    dbConnection.query(sqlQuery, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Database error." });
        }
        return response.status(200).json(result);
    });
});

// Update deck name or subject
app.put('/decks/:deckId', (request, response) => {
    const sqlQuery = "UPDATE decks SET name = ?, subject = ? WHERE deckId = ?";
    const values = [request.body.name, request.body.subject, request.params.deckId];

    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            console.error(err); // Optional: Log the actual error
            return response.status(500).json({ Error: "Failed to update record." });
        }
        return response.status(200).json({ Success: "Deck updated successfully!" });
    });
});

// Delete a deck and its cards
app.delete('/decks/:deckId', (request, response) => {
    const sqlQuery = "DELETE FROM decks WHERE deckId = ?";
    const values = [request.params.deckId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to delete record." });
        }
        return response.status(200).json({ Success: "Deck deleted successfully!" });
    });
});

// ### Card endpoints ###

// List all cards in a deck
app.get('/decks/:deckId/cards', (request, response) => {
    const sqlQuery = "SELECT * FROM cards WHERE deckId = ?";
    const values = [request.params.deckId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Database error." });
        }
        return response.status(200).json(result);
    });
});

// Create a new card in a deck
app.post('/decks/:deckId/cards', (request, response) => {
    const { question, answer } = request.body;
    if (!question || !answer) {
        return response.status(400).json({ Error: "Both question and answer are required." });
    }
    const sqlQuery = "INSERT INTO cards (deckId, question, answer) VALUES (?, ?, ?);";
    const values = [request.params.deckId, question, answer];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to add card." });
        }
        return response.status(201).json({ Success: "Card created successfully." });
    });
});

// Update card question/answer
app.put('/cards/:cardId', (request, response) => {
    const sqlQuery = "UPDATE cards SET question = ?, answer = ? WHERE cardId = ?";
    const values = [request.body.question, request.body.answer, request.params.cardId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to update record." });
        }
        return response.status(200).json({ Success: "Card updated successfully!" });
    });
});

// Delete a card
app.delete('/cards/:cardId', (request, response) => {
    const sqlQuery = "DELETE FROM cards WHERE cardId = ?";
    const values = [request.params.cardId];
    dbConnection.query(sqlQuery, values, (err, result) => {
        if (err) {
            return response.status(500).json({ Error: "Failed to delete record." });
        }
        return response.status(200).json({ Success: "Card deleted successfully!" });
    });
});

app.listen(2000, () => {
    console.log("Express server is running and listening");
});
