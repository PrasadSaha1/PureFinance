document.addEventListener("DOMContentLoaded", function () {
    // attach event listeners to anything that would changing the filtering 
    document.querySelectorAll('input[name="transactionTypeFilter"], input[name="categoryFilter"], #date-filter-checkbox, #price-filter-checkbox, #low-price, #high-price, #start-date, #end-date')
        .forEach(input => {
            input.addEventListener("change", filterTransactions);
        });
});

function getCheckedTransactionTypes() {
    const transactionTypeCheckboxes = document.querySelectorAll('input[name="transactionTypeFilter"]');
    let selectedTypes = [];  
    transactionTypeCheckboxes.forEach(checkbox => {
        if (checkbox.checked){
            selectedTypes.push(checkbox.value);  // add the value to the array
        }
    });
    return selectedTypes;
}

function getCheckedCategories() {
    const categoryCheckboxes = getAllCategoryCheckboxes();  // get all categories, including newly created ones
    let selectedCategories = [];
    categoryCheckboxes.forEach(checkbox => {
        if (checkbox.checked){
            selectedCategories.push(checkbox.value);  // if a valid category, add it to the array
        }
    });
    return selectedCategories;
}

function filterTransactions() {
    toggleCategoryState();  // toggle whether or not checkboxes are greyed out based on whether or not income/expense is selected to be shown
    toggleNoCategoryFilter();  // determine if no category should be shown
    var isError = false;  // if there's an error, don't shown anything

    // get the two checkboxes for income and expense
    selectedTypes = getCheckedTransactionTypes();
    selectedCategories = getCheckedCategories();


    let startDate, endDate;

    const dateToggle = document.getElementById('date-filter-checkbox');
    if (dateToggle.checked) {
        startDate = document.getElementById('start-date').value;  // get the start and end dates
        endDate = document.getElementById('end-date').value;

        // console.log(startDate, endDate)
        
        // check if the dates are valid. If an invalid date (ex. 04-31-2025), the date will be empty
        if (endDate >= startDate && startDate != "" && endDate != "") {
            document.getElementById('date-filter-error-1').style.display = "none";
            document.getElementById('date-filter-error-2').style.display = "none";
        }
        else{  // if invalid
            isError = true;

            // determine the type of error
            if (startDate === "" || endDate === ""){
                document.getElementById('date-filter-error-1').style.display = "block";
            } else {
                document.getElementById('date-filter-error-1').style.display = "none";
            }
            if (endDate < startDate && startDate && endDate){  // make sure the dates are valid to prevent confusing behavior
                document.getElementById('date-filter-error-2').style.display = "block";
            } else {
                document.getElementById('date-filter-error-2').style.display = "none";
            }
        }
    } else {
        // if the date filter is not checked, don't show any errors
        document.getElementById('date-filter-error-1').style.display = "none";
        document.getElementById('date-filter-error-2').style.display = "none";
    }

    let lowPrice, highPrice, strLowPrice, strHighPrice;
    const priceToggle = document.getElementById('price-filter-checkbox');
    if (priceToggle.checked){
        strLowPrice = document.getElementById('low-price').value;
        strHighPrice = document.getElementById('high-price').value;

        

        /*
        if (strLowPrice === "" || strHighPrice === ""){
            isError = true;
            document.getElementById('price-filter-error-1').style.display = "block";
        }
        else{
        */
    

        lowPrice = parseFloat(strLowPrice);
        highPrice = parseFloat(strHighPrice);
        if(lowPrice <= highPrice && !strLowPrice.includes("-") && !strHighPrice.includes("-")){  
            // includePrice = true;
            document.getElementById('price-filter-error-1').style.display = "none";
            document.getElementById('price-filter-error-2').style.display = "none";
           // document.getElementById('price-filter-error-3').style.display = "none";
        }
        else {
            isError = true;
            if (strLowPrice.includes("-") || strLowPrice === "" || strHighPrice.includes("-") || strHighPrice === "") {
                document.getElementById('price-filter-error-1').style.display = "block";
            } else{
                document.getElementById('price-filter-error-1').style.display = "none";
            }
            
            if (lowPrice > highPrice){
                document.getElementById('price-filter-error-2').style.display = "block";
            } else {
                document.getElementById('price-filter-error-2').style.display = "none";
            }
        }
    } else {
        document.getElementById('price-filter-error-1').style.display = "none";
        document.getElementById('price-filter-error-2').style.display = "none";
    }

    let transactions = getAllTransactions();  // get all transactions, including newly created ones
    var noTransactions = true;  // display the no transactions if this stays true

    transactions.forEach(transaction => {
        // remember that the table is 1-indexed
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();  // hidden to the user
        const transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();  // only view-mode, excluding the other categories
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
        const transactionAmount = parseFloat(transaction.querySelector('td:nth-child(5)').textContent.trim().replace('$', '').replace(/,/g, ''));  // trim money of commas and dollar signs
        const formattedDate = new Date(transactionDate).toISOString().split('T')[0];

        if ((selectedTypes.includes(`${transactionType}-filter`)) && // income_source or expense
        (selectedCategories.includes(`${transactionCategory}-${transactionType}-filter`)) &&  // category is seleected (transactionType included in name in case of duplicates across types)
        (!dateToggle.checked || (formattedDate >= startDate && formattedDate <= endDate)) &&  // date is not checked or date is within range
        (!priceToggle.checked || (transactionAmount >= lowPrice && transactionAmount <= highPrice))) {  // price is not checked or price is within range
            transaction.style.display = ""; // show the transaction
            noTransactions = false;  // there is a transaction
        } else {
            transaction.style.display = "none";
        }
    });
    if(noTransactions || isError){
        document.getElementById('noTransactionsText').style.display = "block";
        document.getElementById("transactionsTable").style.display = "none";  // don't show the table
    }
    else{  // show the information
        document.getElementById('noTransactionsText').style.display = "none";
        document.getElementById("transactionsTable").style.display = "table";
    }
    createSummaries();
    updateCurrentBalance();  // update the balance with the new transactions. The Balance only reflects transactions on the screen
}

function toggleCategoryState() {
    /* this function determines whether or not the date, price, and category filters should be greyed out */
    const dateCheckbox = document.getElementById("date-filter-checkbox");
    const priceCheckbox = document.getElementById("price-filter-checkbox");

    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");

    const lowPriceInput = document.getElementById("low-price");
    const highPriceInput = document.getElementById("high-price");

    // toggle the date filter fields
    if (!dateCheckbox.checked) {
        startDateInput.disabled = true; // disable date fields
        endDateInput.disabled = true;
        startDateInput.parentElement.style.opacity = 0.5; // gray them out
        endDateInput.parentElement.style.opacity = 0.5;
    } else {
        startDateInput.disabled = false; // enable date fields
        endDateInput.disabled = false;
        startDateInput.parentElement.style.opacity = 1; // restore opacity
        endDateInput.parentElement.style.opacity = 1;
    }

    // Same thing for the price
    if (!priceCheckbox.checked) {
        lowPriceInput.disabled = true; // disable price fields
        highPriceInput.disabled = true;
        lowPriceInput.parentElement.style.opacity = 0.5; // gray them out
        highPriceInput.parentElement.style.opacity = 0.5;
    } else {
        lowPriceInput.disabled = false; // enable price fields
        highPriceInput.disabled = false;
        lowPriceInput.parentElement.style.opacity = 1; // restore opacity
        highPriceInput.parentElement.style.opacity = 1;
    }

    const incomeCheckbox = document.getElementById("income_source-filter");  // get the checkboxes
    const expenseCheckbox = document.getElementById("expense-filter");

    const incomeCategories = document.querySelectorAll(".income_source-category-filter");  // get the display of the categories for filtering
    const expenseCategories = document.querySelectorAll(".expense-category-filter");

    if (!incomeCheckbox.checked) {  // if not selected, make them all grayed out
        incomeCategories.forEach(checkbox => {
            checkbox.disabled = true; // disable income categories
            checkbox.parentElement.style.opacity = 0.5; // gray them out
        });
    } else {  // if seected, enable them
        incomeCategories.forEach(checkbox => {
            checkbox.disabled = false; // enable income categories
            checkbox.parentElement.style.opacity = 1; // restore opacity
        });
    }

    // same for expense. Remember that both can be checked, and both can be unchecked
    if (!expenseCheckbox.checked) {
        expenseCategories.forEach(checkbox => {
            checkbox.disabled = true; // disable expense categories
            checkbox.parentElement.style.opacity = 0.5; // gray them out
        });
    } else {
        expenseCategories.forEach(checkbox => {
            checkbox.disabled = false; // enable expense categories
            checkbox.parentElement.style.opacity = 1; // restore opacity
        });
    }
}

function resetFilters() {
    /* This resets all the filters to what they were at the start */

    // get the two transaction type checkboxes and all of the category checkboxes, and enable all
    document.querySelectorAll('input[name="transactionTypeFilter"], input[name="categoryFilter"]').forEach(checkbox => {
        checkbox.checked = true;
        checkbox.disabled = false; 
        checkbox.parentElement.style.opacity = 1; 
    });

    document.getElementById('date-filter-checkbox').checked = false;
    document.getElementById('price-filter-checkbox').checked = false;

    // reset date inputs
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    // reset price inputs
    document.getElementById('low-price').value = '';
    document.getElementById('high-price').value = '';

    document.getElementById('byDateML').checked = true;  // sort by date most recent to least recent

    filterTransactions();  // undo the filters and sorts
    sortTransactions();
}


function toggleNoCategoryFilter(){
    /* In order to view a transaction with no category, we have to add a No Category and treat it like it's any category 
    we add it if there's a transaction in that type that needs it, and we delete it if not */

    var incomeNoCategoryNeeded = false;
    var expenseNoCategoryNeeded = false;
    
    var transactions = getAllTransactions();  // including new ones
    transactions.forEach(transaction => {
        // table is 1-indexed
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        const transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();
        if (transactionCategory === "No Category"){
            if (transactionType === "income_source"){  // accomdante for type
                incomeNoCategoryNeeded = true;
            }
            else{
                expenseNoCategoryNeeded = true;
            }
        }
    });
    
    // the div is a checkbox (No Category) that is treated like any other category

    if(incomeNoCategoryNeeded){  // display the div based on if it's needed
        document.getElementById("no-category-income_source-filter-div").style.display = "block";
    } else {
        document.getElementById("no-category-income_source-filter-div").style.display = "none";
    }


    if (expenseNoCategoryNeeded){  // display the div based on if it's needed
        document.getElementById("no-category-expense-filter-div").style.display = "block";
    } else {
        document.getElementById("no-category-expense-filter-div").style.display = "none";
    }

}

 