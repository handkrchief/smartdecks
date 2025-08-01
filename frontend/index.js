let currentUserId;

// ### Registration Section ###

$('#btnRegister').click(function () {
    $("#entryScreen").hide();
    $("#registerSection").removeClass("d-none");
});

$('#cancelRegister').click(function () {
    $("#registerSection").addClass("d-none");
    $("#entryScreen").show();
});

// Create a new user
$('#registerForm').submit(function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this));
    $.ajax({
        url: 'http://localhost:2000/users',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            $('#createResult').html('<div class="alert alert-success">User created successfully.</div>');
            login(response.userId);
        },
        error: function () {
            $('#createResult').html('<div class="alert alert-danger">Failed to create user.</div>');
        }
    });
});

// ### Login Section ###

$('#btnLogin').click(function () {
    $("#entryScreen").hide();
    $("#loginSection").removeClass("d-none");

    // Fetch all users for the dropdown
    $.ajax({
        url: 'http://localhost:2000/users',
        type: 'GET',
        success: function (users) {
            const $dropdown = $('#userDropdown');
            $dropdown.empty();
            users.forEach(user => {
                $dropdown.append(`<option value="${user.userid}">${user.username}</option>`);
            });
        },
        error: function () {
            alert("Failed to load users.");
        }
    });
});

$('#loginUser').click(function () {
    const selectedUserId = $('#userDropdown').val(); // get selected userId
    console.log("Selected userId:", selectedUserId);
    if (!selectedUserId) {
        alert("Please select a user.");
        return;
    }
    login(selectedUserId); // pass the actual ID
});

$('#cancelLogin').click(function () {
    $("#loginSection").addClass("d-none");
    $("#entryScreen").show();
});

function login(userId) {
    currentUserId = userId;
    $("#loginSection").addClass("d-none");
    $("#registerSection").addClass("d-none");

    // Fetch the user's data to display greeting
    $.ajax({
        url: `http://localhost:2000/users/${userId}`,
        type: 'GET',
        success: function (userData) {
            const username = userData[0].username;
            $('#userGreeting').html(`<h2>Welcome <strong>${username}</strong>! Select a deck to review!</h2>`);
            $("#deckSection").removeClass("d-none");
            loadUserDecks(userId);
        },
        error: function () {
            $('#userGreeting').html('<span class="text-danger">Failed to load user info.</span>');
        }
    });
}

// ### Deck Management Section ###

function loadUserDecks(userId) {
    // Clear any existing deck cards
    $('#deckList').empty();

    // Fetch the user's decks
    $.ajax({
        url: `http://localhost:2000/users/${userId}/decks`,
        type: 'GET',
        success: function (decks) {
            if (decks.length === 0) {
                $('#deckList').append('<div class="col-12"><p class="text-muted">No decks yet. Click "Add Deck" to create one.</p></div>');
                return;
            }

            // Loop through each deck and build a Bootstrap card
            decks.forEach(deck => {
                const card = `
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${deck.name}</h5>
                                <p class="card-text">Subject: ${deck.subject || 'None'}</p>
                                <button class="btn btn-primary mb-1 open-deck-btn me-2" data-deckid="${deck.deckID}">Open</button>
                                <button class="btn btn-outline-secondary mb-1 edit-deck-btn me-2" data-deckid="${deck.deckID}">Edit</button>
                                <button class="btn btn-outline-danger delete-deck-btn me-2" data-deckid="${deck.deckID}">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                $('#deckList').append(card);
            });
        },
        error: function () {
            $('#deckList').append('<div class="col-12"><p class="text-danger">Failed to load decks.</p></div>');
        }
    });
    $('#deckSection').removeClass('d-none');
}

$('#logoutBtn').click(function () {
    // Reset app state
    currentUserId = null;

    // Hide all sections
    $('#deckSection').addClass('d-none');
    $('#registerSection').addClass('d-none');
    $('#loginSection').addClass('d-none');

    // Show entry screen
    $('#entryScreen').show();

    // Clear deck list just in case
    $('#deckList').empty();
});

$('#addDeckBtn').click(function () {
    const deckName = prompt("Enter deck name:");
    if (!deckName) return;

    const subject = prompt("Enter subject (optional):");

    $.ajax({
        url: `http://localhost:2000/users/${currentUserId}/decks`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name: deckName, subject }),
        success: function () {
            loadUserDecks(currentUserId); // reload deck list
        },
        error: function () {
            alert("Failed to create deck.");
        }
    });
});

$('#deckList').on('click', '.open-deck-btn', function () {
    const deckId = $(this).data('deckid');
    openDeck(deckId);
});

function openDeck(deckId) {
    $.get(`http://localhost:2000/decks/${deckId}/cards`, function (cards) {
        displayCards(cards, deckId);
    }).fail(function () {
        alert("Failed to load cards.");
    });
}

$('#deckList').on('click', '.edit-deck-btn', function () {
    const deckId = $(this).attr('data-deckid');  // <- use attr here
    const newName = prompt("Enter new deck name:");
    const newSubject = prompt("Enter new subject:");

    $.ajax({
        url: `http://localhost:2000/decks/${deckId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ name: newName, subject: newSubject }),
        success: function () {
            loadUserDecks(currentUserId);
        },
        error: function () {
            alert("Failed to update deck.");
        }
    });
});

$('#deckList').on('click', '.delete-deck-btn', function () {
    const deckId = $(this).data('deckid');
    if (!confirm("Are you sure you want to delete this deck?")) return;

    $.ajax({
        url: `http://localhost:2000/decks/${deckId}`,
        type: 'DELETE',
        success: function () {
            loadUserDecks(currentUserId);
        },
        error: function () {
            alert("Failed to delete deck.");
        }
    });
});

// ### Card Management Section

function displayCards(cards, deckId) {
    $('#deckSection').addClass('d-none');
    $('#cardSection').removeClass('d-none');
    $('#cardList').empty(); // Clear previous cards

    if (cards.length === 0) {
        $('#cardList').append('<p class="text-muted">No cards yet in this deck.</p>');
        return;
    }

    cards.forEach(card => {
        const cardHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${card.question}</h5>
                <p class="card-text">${card.answer}</p>
                <button class="btn btn-sm btn-warning edit-card-btn" data-cardid="${card.cardID}">Edit</button>
                <button class="btn btn-sm btn-danger delete-card-btn" data-cardid="${card.cardID}">Delete</button>
            </div>
        </div>
    `;
        $('#cardList').append(cardHTML);
    });

    // Optional: save deckId somewhere if needed for adding/editing cards
    $('#cardSection').data('deckid', deckId);
}

$('#backToDecks').click(function () {
    $('#cardSection').addClass('d-none');
    $('#deckSection').removeClass('d-none');
});

$('#addCardBtn').click(function () {
    const deckId = $('#cardSection').data('deckid');
    const question = prompt("Enter the card question:");
    if (!question) return;

    const answer = prompt("Enter the card answer:");
    if (!answer) return;

    $.ajax({
        url: `http://localhost:2000/decks/${deckId}/cards`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ question, answer }),
        success: function () {
            openDeck(deckId); // reload cards
        },
        error: function () {
            alert("Failed to create card.");
        }
    });
});

// Delete card
$('#cardList').on('click', '.delete-card-btn', function () {
    const cardId = $(this).data('cardid');
    const deckId = $('#cardSection').data('deckid');

    if (!confirm("Are you sure you want to delete this card?")) return;

    $.ajax({
        url: `http://localhost:2000/cards/${cardId}`,
        type: 'DELETE',
        success: function () {
            openDeck(deckId); // reload
        },
        error: function () {
            alert("Failed to delete card.");
        }
    });
});

// Edit card
$('#cardList').on('click', '.edit-card-btn', function () {
    const cardId = $(this).attr('data-cardid');
    const deckId = $('#cardSection').data('deckid');

    const newQuestion = prompt("Enter the new question:");
    if (!newQuestion) return;

    const newAnswer = prompt("Enter the new answer:");
    if (!newAnswer) return;

    $.ajax({
        url: `http://localhost:2000/cards/${cardId}`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ question: newQuestion, answer: newAnswer }),
        success: function () {
            openDeck(deckId); // reload
        },
        error: function () {
            alert("Failed to update card.");
        }
    });
});

// ### Review Mode Section ###

$('#reviewModeBtn').click(function () {
    if (!currentDeckCards || currentDeckCards.length === 0) {
        alert("No cards to review.");
        return;
    }
    startReviewMode(currentDeckCards);
});

let currentDeckCards = [];

function openDeck(deckId) {
    $('#cardSection').data('deckid', deckId);

    $.get(`http://localhost:2000/decks/${deckId}/cards`, function (cards) {
        currentDeckCards = cards;
        displayCards(cards);
    }).fail(function () {
        alert("Failed to load cards.");
    });
}

function startReviewMode(cards) {
    let index = 0;
    $('#cardList').empty();

    function renderCard() {
        const card = cards[index];
        const reviewHTML = `
            <div class="d-flex justify-content-center mb-3">
                <div id="reviewCard" class="card text-center" style="width: 32rem; height: 500px; perspective: 1000px;">
                    <div class="card-inner" style="position: relative; width: 100%; height: 100%;">
                        <div class="card-front card-body position-absolute w-100 h-100 bg-primary text-white" style="backface-visibility: hidden; display: flex; align-items: center; justify-content: center;">
                            <h5>${card.question}</h5>
                        </div>
                        <div class="card-back card-body position-absolute w-100 h-100 bg-success text-white" style="backface-visibility: hidden; transform: rotateY(180deg); display: flex; align-items: center; justify-content: center;">
                            <h5>${card.answer}</h5>
                        </div>
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-center">
                <button id="prevCard" class="btn btn-outline-secondary me-2" ${index === 0 ? "disabled" : ""}>Previous</button>
                <button id="nextCard" class="btn btn-outline-secondary" ${index === cards.length - 1 ? "disabled" : ""}>Next</button>
                <button id="exitReview" class="btn btn-link ms-3">Back to Cards</button>
            </div>
        `;
        $('#cardList').html(reviewHTML);

        // Add flip behavior
        $('#reviewCard').off('click').on('click', function () {
            $(this).find('.card-inner').toggleClass('flipped');
        });
    }

    $('#cardList').off(); // Clear previous handlers
    $('#cardList').on('click', '#nextCard', function () {
        if (index < cards.length - 1) {
            index++;
            renderCard();
        }
    });

    $('#cardList').on('click', '#prevCard', function () {
        if (index > 0) {
            index--;
            renderCard();
        }
    });

    $('#cardList').on('click', '#exitReview', function () {
        displayCards(currentDeckCards);
    });

    renderCard();
}