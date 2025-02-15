// the purpose of both of these functions is to get all of a certain type of elements plus dynamically created ones

function getAllTransactions() {
    // select all transactions initially
    let transactions = Array.from(document.querySelectorAll('[id^="transaction-id-"]'));
    
    // create a MutationObserver to observe changes in the DOM for new transactions
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {  
            mutation.addedNodes.forEach(node => {  // for each new element
                if (node.nodeType === 1 && node.id && node.id.startsWith("transaction-id-")) {
                    // if a new transaction is valid and is a transaction (based on the ID), add it to the array
                    transactions.push(node);
                }
            });
        });
    });
  
    // start observing for added nodes in the entire body (everything, including desendants)
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
  
    return transactions;  // new and old
  }

function getAllCategoryCheckboxes() {
    // this gets all the category checkboxes for filtering the transactions

    // create an array to store all categories
    let categories = Array.from(document.querySelectorAll('input[name="categoryFilter"]'));

    // create a MutationObserver to observe changes in the DOM for new checkboxes
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                // check if the added node is an element and contains the desired checkbox
                if (node.nodeType === 1) {
                    // get the children of the new node, including the checkbox
                    const newCheckboxes = node.querySelectorAll('input[name="categoryFilter"]');
                    if (newCheckboxes.length > 0) {
                        newCheckboxes.forEach((checkbox) => {
                            categories.push(checkbox);
                            // add event listener to each newly added checkbox
                            checkbox.addEventListener("change", filterTransactions);
                        });
                    }
                }
            });
        });
    });

    // Start observing the entire body for added nodes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // return the categories array, including both old and new checkboxes
    return categories;
}