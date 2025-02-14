document.getElementById("transaction-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the default form submission

    let formData = new FormData(this);

    
    document.getElementById("transaction-form").reset();
    document.getElementById("add_transaction_income_categories").style.display = "none"
    document.getElementById("add_transaction_expense_categories").style.display = "none"

    autofillDate();

    // Determine transaction type and category
    let transactionType = formData.get("transaction_type");
    let transactionCategory = transactionType === "income_source" 
        ? formData.get("income_category") 
        : formData.get("expense_category");

    let transactionName = formData.get("transaction_name");
    let transactionDate = formData.get("transaction_date");
    let transactionAmount = formData.get("transaction_amount");

    let income_categories = formData.get("hidden_income_categories");
    let expense_categories = formData.get("hidden_expense_categories");

    income_categories = income_categories.split(', ').map(item => item.replace(/['\[\]]/g, '').trim());
    expense_categories = expense_categories.split(', ').map(item => item.replace(/['\[\]]/g, '').trim());

    // Create a temporary row with disabled buttons
    let tempRow = document.createElement("tr");
    tempRow.id = "temp-row";
    tempRow.className = transactionType === "income_source" ? "green" : "red";
    
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
    
    // Add the temporary row to the table
    document.querySelector("table tbody").appendChild(tempRow);

    // Send the AJAX request
    fetch("/add_transaction/", {
        method: 'POST',
        headers: {
            "X-CSRFToken": getCSRFToken(),
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // After the transaction has been added, remove the temporary row
        const tempRow = document.getElementById("temp-row");
        if (tempRow) tempRow.remove();

        // Create a new row with the actual transaction data
        let newRow = document.createElement("tr");
        newRow.id = `transaction-id-${data.transactionId}`;
        newRow.className = transactionType === "income_source" ? "green" : "red";

        // Dynamically build the income and expense category options
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

        if (transactionType === "income_source") {
            var options = incomeOptions;
            var formattedType = "income";
        } else {
            var options = expenseOptions;
            var formattedType = "expense";
        }


        // Build the new row's HTML
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

        // Append the new row to the table body
        document.querySelector("table tbody").appendChild(newRow);
        updateCurrentBalance();

        // Reset the form fields

    })
});


function toggleCategoryDivs() {
    var incomeCategoriesDiv = document.getElementById('add_transaction_income_categories');
    var expenseCategoriesDiv = document.getElementById('add_transaction_expense_categories');
    var incomeSelect = incomeCategoriesDiv.querySelector('select');
    var expenseSelect = expenseCategoriesDiv.querySelector('select');

    if (document.getElementById('income_source').checked) {
        incomeCategoriesDiv.style.display = 'block';
        expenseCategoriesDiv.style.display = 'none';
        // Make the income category select required
        incomeSelect.setAttribute('required', 'true');
        expenseSelect.removeAttribute('required');
    } else if (document.getElementById('expense').checked) {
        expenseCategoriesDiv.style.display = 'block';
        incomeCategoriesDiv.style.display = 'none';
        // Make the expense category select required
        expenseSelect.setAttribute('required', 'true');
        incomeSelect.removeAttribute('required');
    }
}

function autofillDate() {
    var today = new Date();
    var day = today.getDate();
    var month = today.getMonth() + 1; // Months are zero-based, so we add 1
    var year = today.getFullYear();

    // Format the date as YYYY-MM-DD (the format required for the <input type="date"> field)
    if (day < 10) {
        day = '0' + day; // Ensure the day is two digits
    }
    if (month < 10) {
        month = '0' + month; // Ensure the month is two digits
    }

    var formattedDate = year + '-' + month + '-' + day;

    // Set the value of the date input
    document.getElementById('transaction-date').value = formattedDate;
}
