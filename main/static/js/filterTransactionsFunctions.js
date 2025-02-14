document.addEventListener("DOMContentLoaded", function () {
    // Attach event listeners to transaction type filter, category filter, and date range checkbox
    document.querySelectorAll('input[name="transactionTypeFilter"], input[name="categoryFilter"], #date-filter-checkbox, #price-filter-checkbox, #low-price, #high-price')
        .forEach(input => {
            input.addEventListener("change", filterTransactions);
        });
        document.getElementById('update-date-button').addEventListener('click', function() {
            filterTransactions();
        });
});


function filterTransactions() {
    toggleCategoryState();
    // fillDatesFilterTransaction();

    var isError = false;

    const transactionTypeCheckboxes = document.querySelectorAll('input[name="transactionTypeFilter"]');
    let selectedTypes = [];
    transactionTypeCheckboxes.forEach(checkbox => {
        if (checkbox.checked){
            selectedTypes.push(checkbox.value);
        }
    });

    const CategoryCheckboxes = document.querySelectorAll('input[name="categoryFilter"]');
    let selectedCategories = [];
    CategoryCheckboxes.forEach(checkbox => {
        if (checkbox.checked){
            selectedCategories.push(checkbox.value);
        }
    });

    let startDate, endDate;

    const dateToggle = document.getElementById('date-filter-checkbox');
    if (dateToggle.checked) {
        startDate = document.getElementById('start-date').value;
        endDate = document.getElementById('end-date').value;
    }

    let lowPrice, highPrice, strLowPrice, strHighPrice;
    var includePrice = false;
    const priceToggle = document.getElementById('price-filter-checkbox');
    if (priceToggle.checked){
        strLowPrice = document.getElementById('low-price').value;
        strHighPrice = document.getElementById('high-price').value;

        if (strLowPrice === "" || strHighPrice === ""){
            isError = true;
            document.getElementById('price-filter-error-2').style.display = "block";
        }
        else{
    

        lowPrice = parseFloat(strLowPrice);
        highPrice = parseFloat(strHighPrice);
        if(lowPrice <= highPrice && !strLowPrice.includes("-") && !strHighPrice.includes("-")){  
            // includePrice = true;
            document.getElementById('price-filter-error-1').style.display = "none";
            document.getElementById('price-filter-error-2').style.display = "none";
            document.getElementById('price-filter-error-3').style.display = "none";
        }
        else {
            isError = true;
            if (strLowPrice.includes("-") || strHighPrice.includes("-")){
                document.getElementById('price-filter-error-2').style.display = "block";
            } else{
                document.getElementById('price-filter-error-2').style.display = "none";
            }
            
            if (lowPrice > highPrice){
                document.getElementById('price-filter-error-3').style.display = "block";
            } else {
                document.getElementById('price-filter-error-3').style.display = "none";
            }
        }
    }
}

    let transactions = getAllTransactions();
    var noTransactions = true;

    transactions.forEach(transaction => {
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        const transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
        const transactionAmount = parseFloat(transaction.querySelector('td:nth-child(5)').textContent.trim().replace('$', '').replace(/,/g, ''));

        const formattedDate = new Date(transactionDate).toISOString().split('T')[0];

        if ((selectedTypes.includes(`${transactionType}-filter`)) && 
        (selectedCategories.includes(`${transactionCategory}-${transactionType}-filter`)) &&
        (!dateToggle.checked || (formattedDate >= startDate && formattedDate <= endDate)) &&
        (!priceToggle.checked || (transactionAmount >= lowPrice && transactionAmount <= highPrice))) {
            transaction.style.display = "";
            noTransactions = false;
        } else {
            transaction.style.display = "none";
        }
    });
    if(noTransactions || isError){
        document.getElementById('noTransactionsText').style.display = "block";
        document.getElementById("transactionsTable").style.display = "none";
    }
    else{
        document.getElementById('noTransactionsText').style.display = "none";
        document.getElementById("transactionsTable").style.display = "table";
    }

    updateCurrentBalance();
}

function toggleCategoryState() {
    const incomeCheckbox = document.getElementById("income_source-filter");
    const expenseCheckbox = document.getElementById("expense-filter");

    const incomeCategories = document.querySelectorAll(".income_source-category-filter");
    const expenseCategories = document.querySelectorAll(".expense-category-filter");

    if (!incomeCheckbox.checked) {
        incomeCategories.forEach(checkbox => {
            checkbox.disabled = true; // Disable income categories
            checkbox.parentElement.style.opacity = 0.5; // Gray them out
        });
    } else {
        incomeCategories.forEach(checkbox => {
            checkbox.disabled = false; // Enable income categories
            checkbox.parentElement.style.opacity = 1; // Restore opacity
        });
    }

    if (!expenseCheckbox.checked) {
        expenseCategories.forEach(checkbox => {
            checkbox.disabled = true; // Disable expense categories
            checkbox.parentElement.style.opacity = 0.5; // Gray them out
        });
    } else {
        expenseCategories.forEach(checkbox => {
            checkbox.disabled = false; // Enable expense categories
            checkbox.parentElement.style.opacity = 1; // Restore opacity
        });
    }
}

function resetFilters() {
    // Reset only checkboxes with specific names
    document.querySelectorAll('input[name="transactionTypeFilter"], input[name="categoryFilter"]').forEach(checkbox => {
        checkbox.checked = true;
        checkbox.disabled = false; // Enable expense categories
        checkbox.parentElement.style.opacity = 1; // Restore opacity
    });

    document.getElementById('date-filter-checkbox').checked = false;
    document.getElementById('price-filter-checkbox').checked = false;

    // Reset date inputs
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';

    // Reset price inputs
    document.getElementById('low-price').value = '';
    document.getElementById('high-price').value = '';
    filterTransactions();
}
