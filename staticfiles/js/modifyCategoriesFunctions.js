function renameCategory(button) {
    // displays the information for renaming the category
    let categoryItem = button.closest('.list-group-item');  // get the category
    categoryItem.querySelector('#renameButtons').style.display = 'inline'; // show the info in the div with id=renameButtons - submit/cancel and the input
    categoryItem.querySelector('span').style.display = 'none';  // get rid of the text
    categoryItem.querySelector('.btn-group').style.display = 'none';  // get rid of the rename and delete button
}

function cancelRename(button) {
    // display the information when the user hits cancel or submit
    let categoryItem = button.closest('.list-group-item');  // get the category
    categoryItem.querySelector('#renameButtons').style.display = 'none';  // hide the submit/cancel button
    categoryItem.querySelector('.error-text').style.display = 'none';  // hide the error text, if visible
    categoryItem.querySelector('span').style.display = 'inline';  // show the plain text and old buttons
    categoryItem.querySelector('.btn-group').style.display = 'inline';
}

function renameCategorySubmit(button, categoryID, transactionType) {
    // get the category and the input
    const categoryName = document.querySelector(`#category-${categoryID.trim()} input[name="category_name"]`).value;
    
    // these check for duplicates. Note that if the user doesn't change the category name, this will still appear
    const categoryList = document.getElementById(`list-group-${transactionType}`);  // get all of the categories
    var categoryNames = []; // will have the list names

    const items = categoryList.children; // get the child elements
    for (var item of items) {
        const category = item.querySelector('span'); // get the text and trim it
        categoryNames.push(category.textContent.trim());
    }

    if (categoryNames.includes(categoryName)) {  // if the name is found
        document.getElementById(`error-message-${categoryID}`).style.display = "inline";
    } else {  // show/hide the error
        document.getElementById(`error-message-${categoryID}`).style.display = "none";
        cancelRename(button);  // display the old buttons again 

        // these lines rename the category as viewed from the categories list
        let categoryItem = button.closest('.list-group-item');  
        let oldName = categoryItem.querySelector('span').textContent;
        categoryItem.querySelector('span').textContent = categoryName;

        // rename the category for adding transactions
        if (transactionType === "income_source"){  // get the correct type
            var CategoryDropdown = document.getElementById('income_category');
        } else{
            var CategoryDropdown = document.getElementById('expense_category');
        }

        for (let i = 0; i < CategoryDropdown.options.length; i++) {
            // loop through the categories until the one with the correct name is found
            // duplicates won't exist as the user can't enter them, and this is only within the transaction type of the category
            if (CategoryDropdown.options[i].textContent === oldName) {  // if it's the one with the name
                CategoryDropdown.options[i].textContent = categoryName;  // change the value and text
                CategoryDropdown.options[i].value = categoryName;
                break;  // we don't need to continue
            }
        }

        // this is for changing the dropdowns in edit transactions
        if(transactionType === "income_source"){
            var categories = document.querySelectorAll('[name="income-categories-for-edit-transaction"]'); // Select elements by name attribute
        }
        else{
            var categories = document.querySelectorAll('[name="expense-categories-for-edit-transaction"]'); // Select elements by name attribute
        }

        categories.forEach((selectElement) => {  // for each transaction 
            const options = selectElement.options;  // get the options
            for (let i = 0; i < options.length; i++) {
                // if this is the option we are looking for, change the information, and then break
                if(options[i].value === oldName){
                    options[i].value = categoryName;
                    options[i].textContent = categoryName;
                    break;
                }
            }
        });

        // this is for changing renaming the name of the category within the transaction list
        var transactions = document.querySelectorAll('[name="transactions"]'); // select the rows

        transactions.forEach((row) => {  // for each
            const firstColumn = row.children[0];  // get the first column
            const hiddenLabel = firstColumn.querySelector('label[hidden]');  // Get the hidden label element

            // Retrieve the text inside the hidden label
            const hiddenText = hiddenLabel ? hiddenLabel.textContent : null;  // If label exists, get the text content
            

            const secondColumn = row.children[1]; // we need the second columm as that's where the category name is
            const span = secondColumn.querySelector('span'); // only get the span, with the name, not the options
            if (span.textContent.trim() === oldName && transactionType === hiddenText) {  // if it's the same name, rename it
                span.textContent = categoryName;
            }
        });

        // this is for renaming the categories within filter transactions 
        var filterCategories = getAllCategoryCheckboxes();
        filterCategories.forEach(category => {
            var categorySplit = category.id.split("-");  // split into the category name, transactionType, and 'filter'
            const label = category.nextElementSibling;  // get the label that goes with the category
            if(categorySplit[0] === oldName && categorySplit[1] === transactionType){  // make sure it's also the right transaction type
                category.id = `${categoryName}-${transactionType}-filter`;  // info is like the others
                category.value = `${categoryName}-${transactionType}-filter`;
                label.textContent = categoryName;
                label.setAttribute('for', `${categoryName}-${transactionType}-filter`);
            }
        });


        // AJAX, done to be more dynamic with no reload
        fetch(`/rename_category/${categoryID}/`, {
            method: "POST",
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                category_name: categoryName,  // to actually put it in the database
            }),
        })
        }
}

function deleteCategory(categoryID, categoryName, transactionType){
    showConfirmationModal("N/A", "Are you sure that you would like to delete this category? All transactions with it will default to 'No Category'")
        .then(proceed => {
            if(proceed) {
                // remove it 
                var category = document.getElementById(`category-${categoryID}`);
                category.remove() 

                // remove it from all sources

                toggleCategoryDivs("deleted"); // if there are no categories left, make the add transaction info invisible
                // this removes it from the category dropdown for adding a transaction
                if (transactionType === "income_source"){  // get the correct dropdown
                    var categoryDropdown = document.getElementById('income_category');
                } else{
                    var categoryDropdown = document.getElementById('expense_category');
                }

                for (let i = 0; i < categoryDropdown.options.length; i++) {  // loop through the category dropdown
                    if (categoryDropdown.options[i].textContent === categoryName) {
                        if (categoryDropdown.options[i].selected){
                            categoryDropdown.selectedIndex = 0;  // if it's selected, put the current option at the first
                        }
                        categoryDropdown.remove(i);  // remove the option
                        break;  // exit the loop once the option is found and removed as it would only occur once
                    }
                }
                
                // these lines remove it from the dropdown for each transaction
                if(transactionType === "income_source"){  // get each transaction
                    var categoryDropdowns = document.querySelectorAll('[name="income-categories-for-edit-transaction"]'); 
                }
                else{
                    var categoryDropdowns = document.querySelectorAll('[name="expense-categories-for-edit-transaction"]');
                }

                // loop through 
                categoryDropdowns.forEach((selectElement) => {
                    const options = selectElement.options;  // get the categories
                    for (let i = 0; i < options.length; i++) {
                        if(options[i].value === categoryName){  // remove it 
                            selectElement.remove(i);
                        }
                    }
                });

                // these lines make it so that if the current category is the deleted category, it goes to no category
                var transactions = getAllTransactions() // get all transactions, including new ones

                transactions.forEach((row) => {
                    const secondColumn = row.children[1]; // we need the second columm as that's where the category name is
                    const span = secondColumn.querySelector('span'); // only get the span, with the name, not the options
                    if (span.textContent.trim() === categoryName) {
                        span.textContent = "No Category";
                    }
                });

                // delete the transaction from filter transactions
                var filterCategories = getAllCategoryCheckboxes();
                filterCategories.forEach(category => {
                    var categorySplit = category.id.split("-");  // split it on name, type, and 'filter'
                    const label = category.nextElementSibling;  // get the corresponding label

                    if(categorySplit[0] === categoryName && categorySplit[1] === transactionType){
                        category.remove();  // remove both 
                        label.remove();
                    }
                });
                toggleNoCategoryFilter();  // show No Category for filtering if needed 


                // send the AJAX request. It's done after everything to make it more dynamic
                fetch(`/delete_category/${categoryID}/`, {
                    method: "POST",
                    headers: {
                        'X-CSRFToken': getCSRFToken(),
                    },
                })
            } 
        });
}
