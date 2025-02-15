
// whenever a new transaction is made, this will run
document.getElementById("transaction-form").addEventListener("submit", function(event) {
    event.preventDefault(); // prevent is from being submitted. The form will be submitted with an AJAX request

    let formData = new FormData(this); // get the form data
    
    // reset the form. We can do this as all the input validation was already done before this point
    document.getElementById("transaction-form").reset();
    document.getElementById("add_transaction_income_categories").style.display = "none"
    document.getElementById("add_transaction_expense_categories").style.display = "none"

    autofillDate();

    // get the transaction information
    let transactionType = formData.get("transaction_type");
    let transactionCategory = transactionType === "income_source" // get what is needed
        ? formData.get("income_category") 
        : formData.get("expense_category");

    let transactionName = formData.get("transaction_name");
    let transactionDate = formData.get("transaction_date");
    let transactionAmount = formData.get("transaction_amount");

    // we need these so we can put them in the edit transaction mode later on
    let income_categories = formData.get("hidden_income_categories");  // get the hidden categories
    let expense_categories = formData.get("hidden_expense_categories");

    income_categories = income_categories.split(', ').map(item => item.replace(/['\[\]]/g, '').trim());
    expense_categories = expense_categories.split(', ').map(item => item.replace(/['\[\]]/g, '').trim());

    // create a transaction row that will be displayed while the AJAX request is being made. We can't display the final thing as we need the ID
    let tempRow = document.createElement("tr");
    tempRow.id = "temp-row";
    tempRow.className = transactionType === "income_source" ? "green" : "red";  // determine the color
    
    // the user will be unable to use the buttons for a few seconds as the AJAX request is being made
    tempRow.innerHTML = `
        <td>
            <label hidden>${transactionType}</label>
        </td>
        <td>
            <span class="view-mode">${transactionCategory || "No Category"}</span>
        </td>
        <td>
            <span class="view-mode">${formatDate(transactionDate)}</span>
        </td>
        <td>
            <span class="view-mode">${transactionName}</span>
        </td>
        <td>
            <span class="view-mode">$${formatMoney(transactionAmount)}</span>
        </td>
        <td>
            <button type="button" class="btn btn-primary btn-sm edit-btn" disabled>Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-btn" disabled>Delete</button>
        </td>
    `;
    
    // add the temporary row to the table, needed for it to appear
    document.querySelector("table tbody").appendChild(tempRow);
    sortTransactions(); // filter and sort with the new row. Must be called again after the tempRow is deleted
    filterTransactions();

    // send the AJAX request
    fetch("/add_transaction/", {
        method: 'POST',
        headers: {
            "X-CSRFToken": getCSRFToken(),
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // we can now remove the temp row
        const tempRow = document.getElementById("temp-row");
        tempRow.remove();

        // real transaction can be made with the id
        let newRow = document.createElement("tr");
        newRow.id = `transaction-id-${data.transactionId}`;
        newRow.className = transactionType === "income_source" ? "green" : "red";

        // make the income and expense options here (only one will be shown).
        // this must be done because the logic of the django template can not be replicated in js
        let incomeOptions = income_categories.map(category => 
            `<option value="${category}" ${category === transactionCategory ? 'selected' : ''}>
                ${category}
            </option>`
        ).join('');

        let expenseOptions = expense_categories.map(category => 
            `<option value="${category}" ${category === transactionCategory ? 'selected' : ''}>
                ${category}
            </option>`
        ).join('');

        // select the correct options. the formattedType is needed as in some places, income is used instead of income_source
        if (transactionType === "income_source") {
            var options = incomeOptions;
            var formattedType = "income";
        } else {
            var options = expenseOptions;
            var formattedType = "expense";
        }


        // we can now make the new row, similar to how it is for the other transactions
        newRow.innerHTML = `
        <td>
            <label hidden>${transactionType}</label>
        </td>
        <td>
            <span class="view-mode">${transactionCategory || "No Category"}</span>
           
                <select class="edit-mode-category-dropdown form-select" name="${formattedType}-categories-for-edit-transaction" style="display:none;">
                    ${options}
                </select>
        </td>
        <td>
            <span class="view-mode">${formatDate(transactionDate)}</span>
            <input type="date" class="edit-mode form-control" name="date" value="${formatTransactionDate(transactionDate)}" style="display:none;" required>
        </td>
        <td>
            <span class="view-mode">${transactionName}</span>
            <input type="text" class="edit-mode form-control" name="name" value="${transactionName}" style="display:none;" maxlength="50" required pattern="^[A-Za-z0-9 ]*$">
        </td>
        <td>
            <span class="view-mode">$${formatMoney(transactionAmount)}</span>
            <input type="number" step="0.01" class="edit-mode form-control" name="amount" value="${transactionAmount}" style="display:none;" required id="amount">
        </td>
        <td>
            <button type="button" class="btn btn-primary btn-sm edit-btn" onclick="toggleEditTransactionMode('${data.transactionId}', '${transactionType}')">Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-btn" onclick="confirmDelete('${data.transactionId}')">Delete</button>
            <button type="button" class="btn btn-success btn-sm save-btn" onclick="saveTransaction('${data.transactionId}', '${transactionType}')" style="display:none;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm cancel-btn" onclick="cancelEditTransaction('${data.transactionId}')" style="display:none;">Cancel</button>
        </td>
    `;

        // append the new row to the table and make it appear
        document.querySelector("table tbody").appendChild(newRow);

        // we must filter and sort the transactions again as we deleted the old row
        filterTransactions();
        sortTransactions();

    })
});


function toggleCategoryDivs() {
    /* This determines which dropdown, if any, will be shown on add transaction */

    // get the entire div
    var incomeCategoriesDiv = document.getElementById('add_transaction_income_categories');
    var expenseCategoriesDiv = document.getElementById('add_transaction_expense_categories');
    
    // get only the options
    var incomeSelect = incomeCategoriesDiv.querySelector('select');
    var expenseSelect = expenseCategoriesDiv.querySelector('select');

    if (document.getElementById('income_source').checked) {
        incomeCategoriesDiv.style.display = 'block';
        expenseCategoriesDiv.style.display = 'none';
        incomeSelect.setAttribute('required', 'true');  // make it required
        expenseSelect.removeAttribute('required');  // stop the invisible one from being required
    } else if (document.getElementById('expense').checked) {
        expenseCategoriesDiv.style.display = 'block';
        incomeCategoriesDiv.style.display = 'none';
        expenseSelect.setAttribute('required', 'true');  // make it required
        incomeSelect.removeAttribute('required');  // stop the invisible one from being required
    }
}

function autofillDate() {
    /* This fills the date input with the current date in the add transactions menu. Called after each transaction is added and on page refresh */
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1; // months are zero-based, so we add 1
    var year = today.getFullYear();

    // format the date as YYYY-MM-DD (the format required for the <input type="date"> field)
    if (day < 10) {
        day = '0' + day; // ensure the day is two digits
    }
    if (month < 10) {
        month = '0' + month; // ensure the month is two digits
    }

    var formattedDate = `${year}-${month}-${day}`;

    // set the value of the date input
    document.getElementById('transaction-date').value = formattedDate;
}
