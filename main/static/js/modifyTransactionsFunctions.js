
function toggleDeleteSelectedButtonVisibility() {
    // this function determines whether or not the delete selected button, used for deleting multiple transactions at a time, will be visible
    // used in toggleSelectAll() (below) and the input for selecting a transaction for deletion

    const selectedTransactions = document.querySelectorAll('.select-transaction:checked');
    const deleteButton = document.getElementById('delete-selected-btn');  // the id for the delete button
    
    if (selectedTransactions.length > 0) {
        deleteButton.style.display = 'inline-block';
    } else {
        deleteButton.style.display = 'none';
    }
}

function toggleSelectAll(source) {
    // this function selects each transaction
    const checkboxes = document.querySelectorAll('.select-transaction');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
    toggleDeleteSelectedButtonVisibility(); // Update delete button visibility
    }

function massDeleteTransactions() {
    // this function deletes the selected transactions
    const selectedTransactions = document.querySelectorAll('.select-transaction:checked'); // get the transactions
    const idsToDelete = Array.from(selectedTransactions).map(checkbox => checkbox.getAttribute('data-id'));  // get their ids

    if (idsToDelete.length > 0) {
        // Show confirmation modal before proceeding with deletion
        const confirmationMessage = `Are you sure you want to delete ${idsToDelete.length} transaction(s)?`;
        updateCurrentBalance();
        const form = document.createElement('form');
        form.method = 'POST'; 
        form.action = '/delete_mass_transactions/';

        // Add the transaction IDs to the form data
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'transaction_ids';
        input.value = JSON.stringify(idsToDelete);
        form.appendChild(input);

        // Show the confirmation modal
        showConfirmationModal(form, confirmationMessage);
    }
}


function confirmDelete(transactionId) {
    if (showConfirmationModal("N/A", "Are you sure that you would like to delete this transaction?")) {
        deleteTransaction(transactionId);
    }
}

    
function deleteTransaction(transactionId) {
    const row = document.getElementById(`transaction-id-${transactionId}`);
    row.remove();
    updateCurrentBalance();
    // send the AJAX request
    fetch(`/delete_transaction/${transactionId}/`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
}

function toggleEditTransactionMode(transactionId, transactionType) {
    const row = document.getElementById(`transaction-id-${transactionId}`);  // get the row
    row.querySelectorAll('.view-mode').forEach(el => el.style.display = 'none');  // turn off view mode
    row.querySelectorAll('.edit-mode').forEach(el => el.style.display = '');  // turn on edit mode, allowing it to be edited

    const categoryDropdowns = row.querySelectorAll('.edit-mode-category-dropdown'); // Get category dropdowns

    categoryDropdowns.forEach(dropdown => {
        if (transactionType === "income_source" && dropdown.name === "income-categories-for-edit-transaction") {
            dropdown.style.display = '';  // Show income categories
        } else if (transactionType === "expense" && dropdown.name === "expense-categories-for-edit-transaction") {
            dropdown.style.display = '';  // Show expense categories
        } else {
            dropdown.style.display = 'none';  // Hide the other dropdown
        }
    });



    row.querySelector('.edit-btn').style.display = 'none';  // the edit and delete buttons disappears
    row.querySelector('.delete-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = '';  // the save and cancel buttons appear
    row.querySelector('.cancel-btn').style.display = '';
}

function cancelEditTransaction(transactionId){
    // this turns off edit mode for a transaction, called when a user clicks cancel while editing a transaction

    const row = document.getElementById(`transaction-id-${transactionId}`);  // get the id
    row.querySelectorAll('.view-mode').forEach(el => el.style.display = '');  // turn view mode on
    row.querySelectorAll('.edit-mode').forEach(el => el.style.display = 'none');  // turn edit mode off
    row.querySelectorAll('.edit-mode-category-dropdown').forEach(el => el.style.display = 'none');  // turn on edit mode, allowing it to be edited
    row.querySelector('.edit-btn').style.display = '';  // the edit and delete buttons appear
    row.querySelector('.delete-btn').style.display = '';  
    row.querySelector('.save-btn').style.display = 'none';  // the save and cancel buttons disappear
    row.querySelector('.cancel-btn').style.display = 'none';
    row.querySelectorAll('.error-message').forEach(el => el.remove());  // the error messages dissappear (only for that transaction)

}


function saveTransaction(transactionId, transactionType) {
    // this function saves the transaction after a user edits it
    const row = document.getElementById(`transaction-id-${transactionId}`);  // get the row
    // const categoryField = row.querySelector('select[name="category"]');  // get the category, date, name, and amount
    const dateField = row.querySelector('input[name="date"]');
    const nameField = row.querySelector('input[name="name"]');
    const amountField = row.querySelector('input[name="amount"]');
    
    const categoryDropdowns = row.querySelectorAll('.edit-mode-category-dropdown'); // Get category dropdowns
    let categoryField;
    categoryDropdowns.forEach(dropdown => {
        if (transactionType === "income_source" && dropdown.name === "income-categories-for-edit-transaction") {
            categoryField = row.querySelector('select[name="income-categories-for-edit-transaction"]'); 
        } else if (transactionType === "expense" && dropdown.name === "expense-categories-for-edit-transaction") {
            categoryField = row.querySelector('select[name="expense-categories-for-edit-transaction"]'); 
        } 
    });

    // remove whitespace
    const category = categoryField.value.trim();
    const date = dateField.value.trim();
    const name = nameField.value.trim();
    const amount = amountField.value.trim();

    // clear previous error messages
    row.querySelectorAll('.error-message').forEach(el => el.remove());

    let hasError = false;

    // shows errors if they arise
    function showError(field, message) {
        const errorMessage = document.createElement('span');  // make the error message
        errorMessage.className = 'error-message';
        
        errorMessage.style.marginLeft = '10px';  // styling
        errorMessage.textContent = message;
        field.parentNode.appendChild(errorMessage);  // append the error message to the div
        hasError = true;  // prevent the AJAX request 
    }

    //  show error messages if the fields are empty or invalid
    if (!category) {
        showError(categoryField, 'Category is required');
    }
    if (!date) {
        showError(dateField, 'Date is invalid');
    }
    else {
        const [year] = date.split('-').map(Number);
        if (year < 1900 || year > 2100) {
            showError(dateField, '1900-2100 only');
        }
    }
    if (!name) {
        showError(nameField, 'Name is required');
    }
    else if (!/^[A-Za-z0-9 ]+$/.test(name)) {  // no symbols are allowed, but spaces are
        showError(nameField, "Must have no symbols")
    }

    if (!amount) {  
        showError(amountField, 'Amount is required');
    }
    else if (parseFloat(amountField.value.trim()) < 0){
        showError(amountField, 'Amount must be positive')
    }

    // will not continue if there are error
    if (hasError) {
        return;
    }

    const elements = row.querySelectorAll('.view-mode');  // get all the elements (view mode)
    elements[0].textContent = category;  // change the text for view mode
    elements[1].textContent = formatDate(date);
    elements[2].textContent = name;
    elements[3].textContent = `$${parseFloat(amount).toFixed(2)}`;

    cancelEditTransaction(transactionId);
    updateCurrentBalance();


    // send the AJAX request
    fetch(`/update_transaction/${transactionId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ category, date, name, amount })  // pass in the data
    })
    .then(response => response.json())
    .then(data => {

    })
}

