// get the forms for adding categories. They need seperate names as then, we would only be able to access one
const forms = document.querySelectorAll('#add_category_income_source, #add_category_expense');

// whenver the user submits the form, this function is called
forms.forEach(form => { // get the event listener for both forms
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // prevent the submissions of the form. This prevents a reload and helps makes the page more dynamic

        const formData = new FormData(this);  // retrieve the form's information 

        // get information about the new category
        const categoryName = formData.get("category_name");  
        const transactionType = formData.get("transaction_type");  
        
        // this is the html container that has all the categories for that transaction type. We will use this to check if the new category is unique
        const categoryList = document.getElementById(`list-group-${transactionType}`);  
        var categoryNames = [];  // this will extract the names of the categories

        // this can be used as a boolean, to true if there are no categories
        var noCategoriesText = document.getElementById(`noCategoriesText_${transactionType}`)

        if(!noCategoriesText) {  // if there are categories
            // loop through all of the categories and add them to an array
            const items = categoryList.children; // get the children elements
            for (var item of items) {  
                const category = item.querySelector('span'); // this is the name of the category 
                categoryNames.push(category.textContent.trim());  // get the text
            }
        }
         
        // the errors are named with the transaction type as they must be unique for the transaction type
        if (categoryNames.includes(categoryName)) {  // if the category name is found, display the error and don't proceed
            document.getElementById(`error-message-category-taken-${transactionType}`).style.display = "block";
        } else if (categoryName === "No Category" || categoryName === "None") {  // edge case, the user can't add a category called "No Category"
            document.getElementById(`error-message-invalid-category-${transactionType}`).style.display = "block"; // show the error message
        } else { 
            document.getElementById(`error-message-category-taken-${transactionType}`).style.display = "none"; // hide the error message 
            document.getElementById(`error-message-invalid-category-${transactionType}`).style.display = "none"; // hide the error message 

            if (noCategoriesText){
                noCategoriesText.remove();  // remove the text if it is there
            }

            // we can't make the final category yet because we need the id from the AJAX request. So, we make a temporary one for the user to see something
            const newItem = document.createElement('div');  // creates a new div element
            newItem.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";  // put it into the same class as the other categories

            // for now, display the buttons, but the user can't interact with them yet 
            // the user probably won't notice them not being usable as this is during the fade in animation
            newItem.innerHTML = `
            <span>${categoryName}</span>
            <div class="btn-group">
                <button class="btn btn-warning btn-sm ms-2" disabled>Rename</button>
                <button class="btn btn-danger btn-sm ms-2" disabled>Delete</button>
            </div>
            `;
            categoryList.appendChild(newItem);  // needed to show on the screen
            document.getElementById(`new-category-name-${transactionType}`).value = '';  // cleans the input field for adding new categories

            // these lines dynamically add the new category to the add transaction drop down for categories
            if (transactionType === "income_source"){  // get the correct dropdown
                var categoryDropdown = document.getElementById('income_category');
            } else{
                var categoryDropdown = document.getElementById('expense_category');
            }

            const newOption = document.createElement('option');  // create a new option
            newOption.value = categoryName;  // value and text as the category name
            newOption.textContent = categoryName;
            categoryDropdown.appendChild(newOption);  // add to the category dropdown
        
            // these lines dynamically add the new category to the dropdown for editing transaction
            // we start by getting all of the transactions for the transaction type
            if(transactionType === "income_source"){  // get the correct type of transaction
                var categories = document.querySelectorAll('[name="income-categories-for-edit-transaction"]'); 
            }
            else{
                var categories = document.querySelectorAll('[name="expense-categories-for-edit-transaction"]'); 
            }

            categories.forEach((selectElement) => {  // for all of the dropdowns for transaction in the transaction type (income_source or expense)
                const newOption = document.createElement('option');  // make the option
                newOption.value = categoryName;   // set the value and text
                newOption.textContent = categoryName;  
                selectElement.appendChild(newOption); // add to the dropdown
            });

            // these lines dynamically add the new category to filter transactions
            const newDiv = document.createElement('div');
            newDiv.classList.add('form-check', 'mt-2');  // make the characteristics of the div
        
            // create the checkbox input in the same way as the other checkboxes
            const newCheckbox = document.createElement('input');
            newCheckbox.classList.add('form-check-input', `${transactionType}-category-filter`);
            newCheckbox.type = 'checkbox';
            newCheckbox.name = 'categoryFilter';
            newCheckbox.id = `${categoryName}-${transactionType}-filter`;
            newCheckbox.value = `${categoryName}-${transactionType}-filter`;
            newCheckbox.checked = true;
        
            // create the label
            const newLabel = document.createElement('label');
            newLabel.classList.add('form-check-label');
            newLabel.setAttribute('for', `${categoryName}-${transactionType}-filter`);
            newLabel.textContent = categoryName;
        
            // append the new elements to the div
            newDiv.appendChild(newCheckbox);
            newDiv.appendChild(newLabel);
        
            // find the container for Income Source categories and add the new div, making it appear on screen
            if (transactionType === "income_source") {
                var container = document.getElementById('income-categories-filter');
            }
            else {
                var container = document.getElementById('expense-categories-filter');
            }
            container.appendChild(newDiv)



            // send the AJAX request. Again, we do it on the frontend to make it dynamic
            fetch("/add_category/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // now, with the id, we make the real category
                newItem.id = `category-${data.id}`;  // idenify the category like the others

                // the innerHTML is the same as for the other categories, but we need to adjust the way we add data (with js, not django templates)
                newItem.innerHTML = `
                                <div style="display:none;" id="renameButtons">
                <div class="d-flex align-items-center">
                    <input type="text" name="category_name" value="${ data.category_name }" class="form-control" style="width: 240px;" maxlength="25" pattern="^[A-Za-z0-9 ]*$">
                    <button type="submit" class="btn btn-success btn-sm ms-2" style="margin-left: 20px; margin-right: 5px;" onclick="renameCategorySubmit(this, '${data.id}', '${data.transaction_type}')">Submit</button>
                    <button type="button" class="btn btn-secondary btn-sm ms-2" onclick="cancelRename(this)">Cancel</button>
                </div> 
                <!-- Error message now placed below the input and buttons -->
                <p id="error-message-${data.id}" class="error-text" style="display: none; margin-top: 10px;">
                    Category name already taken!
                </p>
            </div>
            
            <span>${ data.category_name }</span>
            <div class="btn-group">
                <button class="btn btn-warning btn-sm ms-2" onclick="renameCategory(this)">Rename</button>
                <button class="btn btn-danger btn-sm ms-2" onclick="deleteCategory('${data.id}', '${data.category_name}', '${data.transaction_type}');">Delete</button>
            </div>
                `;
                }
            )
        }
    });
})