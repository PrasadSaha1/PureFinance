function deleteTransaction(transactionId) {
    /* Deletes a transaction */
    const row = document.getElementById(`transaction-id-${transactionId}`);
    row.remove();  // remove it from sight
    filterTransactions(); // this will also update the current balance

    toggleNoCategoryFilter();  // see whether or not No Category is needed (if this was the only transaction with No Category, it is not needed anymore)
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
    /* This toggles edit mode for transactions */

    const row = document.getElementById(`transaction-id-${transactionId}`);  // get the row
    row.querySelectorAll('.view-mode').forEach(el => el.style.display = 'none');  // turn off view mode
    row.querySelectorAll('.edit-mode').forEach(el => el.style.display = '');  // turn on edit mode, allowing it to be edited

    const categoryDropdowns = row.querySelectorAll('.edit-mode-category-dropdown'); // Get category dropdowns

    categoryDropdowns.forEach(dropdown => {
        if (transactionType === "income_source" && dropdown.name === "income-categories-for-edit-transaction" ||
            transactionType === "expense" && dropdown.name === "expense-categories-for-edit-transaction"
        ) {
            if (dropdown.options.length){
                dropdown.style.display = '';  // Show income categories
            } else {
                document.getElementById(`noCategoryEditTransaction-${transactionId}`).style.display = "block"  
            }
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


function showError(field, message) {
    /* Shows an error with saving the transaction */
    const errorMessage = document.createElement('span');  // make the error message
    errorMessage.className = 'error-message';
    
    errorMessage.style.marginLeft = '10px';  // styling
    errorMessage.textContent = message;
    field.parentNode.appendChild(errorMessage);  // append the error message to the div
   // hasError = true;  // prevent the AJAX request 
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
    console.log(categoryField)

    // remove whitespace


    var category = categoryField.value.trim();
    if (category === ""){
        category = "No Category"
    }

    
    const date = dateField.value.trim();
    const name = nameField.value.trim();
    const amount = amountField.value.trim();

    // clear previous error messages
    row.querySelectorAll('.error-message').forEach(el => el.remove());

    let hasError = false;  // if true, no AJAX request

    // shows errors if they arise

    //  show error messages if the fields are empty or invalid
   // if (!category) {
    //    showError(categoryField, 'Category is required');
     //   hasError = true;
    // }
    if (!date) {
        showError(dateField, 'Date is invalid');
        hasError = true;
    }
    else {
        const [year] = date.split('-').map(Number);
        if (year < 1900 || year > 2100) {
            showError(dateField, '1900-2100 only');
            hasError = true;
        }
    }
    if (!name) {
        showError(nameField, 'Name is required');
        hasError = true;
    }
    else if (!/^[A-Za-z0-9 ]+$/.test(name)) {  // no symbols are allowed, but spaces are
        showError(nameField, "Must have no symbols")
        hasError = true;
    }

    if (!amount) {  
        showError(amountField, 'Amount is required');
        hasError = true;
    }
    else if (parseFloat(amountField.value.trim()) < 0){
        showError(amountField, 'Amount must be positive')
        hasError = true;
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
    console.log()

    cancelEditTransaction(transactionId);  // the equivlant of the user clicking cancel to go back to view mode
    filterTransactions();  // this will also update the current Balance 


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
}

