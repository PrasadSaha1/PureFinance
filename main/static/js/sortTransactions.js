function sortTransactions() {
    // this function sorts the transactions 

    // gets the value currently checcked
    const sortOption = document.querySelector('input[name="transactionSort"]:checked').value;
    let transactions = getAllTransactions();  // get all old and new transactions

    // sort them by comparing each one to each other
    transactions.sort((a, b) => {
        switch (sortOption) {
            case 'byNameAZ':  // alphabetical name
                return a.querySelector('td:nth-child(4)').innerText.localeCompare(b.querySelector('td:nth-child(4)').innerText);
            case 'byNameZA':  // reverse name
                return b.querySelector('td:nth-child(4)').innerText.localeCompare(a.querySelector('td:nth-child(4)').innerText);
            case 'byAmountLH':  // low to high price
                return parseFloat(a.querySelector('td:nth-child(5)').innerText.substring(1).replace(/,/g, '')) - 
                       parseFloat(b.querySelector('td:nth-child(5)').innerText.substring(1).replace(/,/g, ''))
            case 'byAmountHL':  // high to low price
                return parseFloat(b.querySelector('td:nth-child(5)').innerText.substring(1).replace(/,/g, '')) - 
                       parseFloat(a.querySelector('td:nth-child(5)').innerText.substring(1).replace(/,/g, ''));                         
            case 'byDateLM':  // least recent to most recent date
                return new Date(a.querySelector('td:nth-child(3)').innerText) - new Date(b.querySelector('td:nth-child(3)').innerText);
            default: // the default is byDateML, most recent to least recent
                return new Date(b.querySelector('td:nth-child(3)').innerText) - new Date(a.querySelector('td:nth-child(3)').innerText);
        }
    });

    const tbody = document.querySelector('#transactionsTable tbody');
    transactions.forEach(transactions => tbody.appendChild(transactions));
}
