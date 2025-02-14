// get the forms for adding categories. They need seperate names as then, we would only be able to access one
const forms = document.querySelectorAll('#add_category_income_source, #add_category_expense');

forms.forEach(form => { // get the event listener for both forms
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // prevent form submission

        const formData = new FormData(this);  // retrieve the form
        const categoryName = formData.get("category_name");  // get the name from the form
        const transactionType = formData.get("transaction_type");  // income_source or expense
        const categoryList = document.getElementById(`list-group-${transactionType}`);  // the categories for that transaction type. Contains the full html element, with the buttons
        var categoryNames = [];  // this will extract the names of the categories

        // see if there are no categories and the text is being dispalyd
        var noCategoriesText = document.getElementById(`noCategoriesText_${transactionType}`)

        if(noCategoriesText){  // if the text is present, remove it
            noCategoriesText.remove()
        }
        else{
            const items = categoryList.children; // get the children elements
            for (var item of items) {  
                const category = item.querySelector('span'); // this is the name of the category 
                categoryNames.push(category.textContent.trim());  // get the text
            }
        }
         
        if (categoryNames.includes(categoryName)) {  // if the category name is found, display the error and don't proceed
            document.getElementById(`error-message-${transactionType}`).style.display = "block";
        } else { 
            document.getElementById(`error-message-${transactionType}`).style.display = "none"; // hide the error message 
            
            // we can't make the final category yet because we need the id from the AJAX request. So, we make a temporary one for the user
            const newItem = document.createElement('div');  // creates a new div element
            newItem.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";  // put it into the same class as the other categories

            // for now, display the buttons, but the user can't interact with them yet 
            // the user won't notice them not being usable as this is during the fade in animation
            newItem.innerHTML = `
            <span>${categoryName}</span>
            <div class="btn-group">
                <button class="btn btn-warning btn-sm ms-2" disabled>Rename</button>
                <button class="btn btn-danger btn-sm ms-2" disabled>Delete</button>
            </div>
            `;
            categoryList.appendChild(newItem);  // append it to the list of categories
            document.getElementById(`new-category-name-${transactionType}`).value = '';  // cleans the input field for adding new categories

            // these lines dynamically add the new category to the add transaction drop down for categories
            if (transactionType === "income_source"){  // get the correct dropdown
                var CategoryDropdown = document.getElementById('income_category');
            } else{
                var CategoryDropdown = document.getElementById('expense_category');
            }

            const newOption = document.createElement('option');  // create a new option
            newOption.value = categoryName;  // value and text as the category name
            newOption.textContent = categoryName;
            CategoryDropdown.appendChild(newOption);  // add to the category dropdown
        
            // these lines dynamically add the new category to the dropdown for editing transaction
            if(transactionType === "income_source"){  // get the correct type of transaction
                var categories = document.querySelectorAll('[name="income-categories-for-edit-transaction"]'); // get all elements with the name
            }
            else{
                var categories = document.querySelectorAll('[name="expense-categories-for-edit-transaction"]'); // get all elements with the name
            }

            categories.forEach((selectElement) => {  // for all of the dropdowns for transaction in the transaction type (income_source or expense)
                const newOption = document.createElement('option');  // make the option
                newOption.value = categoryName;   // set the value and text
                newOption.textContent = categoryName;  
                selectElement.appendChild(newOption); // add to the dropdown
            });

            /*
            // these lines dynamically add the new category to filter transactions
            if (transactionType === "income_source") {  
                // Get all elements with the class for income categories
                var categoriesForFilter = document.querySelector('.income_source-category-filter');  
            } else {
                // Get all elements with the class for expense categories
                var categoriesForFilter = document.querySelector('.expense-category-filter');
            }
            
            // Create a new checkbox input element
            console.log(categoriesForFilter)
            const newCategoryForFilter = document.createElement('input');
            newCategoryForFilter.type = 'checkbox';  // Define it as a checkbox
            newCategoryForFilter.value = categoryName;  // Set the value as the category name
            newCategoryForFilter.id = categoryName + "-checkbox";  // Optional: give it an ID based on the category name
            
            // Create a label for the checkbox
            const label = document.createElement('label');
            label.setAttribute('for', newCategoryForFilter.id);
            label.textContent = categoryName;  // Set the label text as the category name
            
            // Append the checkbox and label to the categoriesForFilter element
            categoriesForFilter.appendChild(newCategoryForFilter);  
            categoriesForFilter.appendChild(label);              

            console.log(categoriesForFilter);
            */

            // send the AJAX request. 
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

                // the innerHTML is the same as for the other categories 
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