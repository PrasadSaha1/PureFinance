// any time the user changes the value of the search bar, this will be triggered
document.getElementById('transaction-search').addEventListener('input', function() {
    let filter = this.value.toLowerCase().replace(/\s+/g, ''); // remove whitespace and make it lowercase, increasing the yield
    let transactions = getAllTransactions();  // get all new and old transactions

    transactions.forEach(function(transaction) {  // for each transaction
        let transactionText = Array.from(transaction.cells)  // 
            .slice(2, 4) // only get cell three, with the name of the transaction
            .map(cell => cell.textContent.toLowerCase().trim().replace(/\s+/g, '')) // remove whitespace and make it lowercase
            .join(' '); // join the string (only ement)

        // if the row's text matches the filter, show the row, otherwise hide it
        if (transactionText.includes(filter)) {
            transaction.style.display = '';
        } else {
            transaction.style.display = 'none';
        }
    });
});
