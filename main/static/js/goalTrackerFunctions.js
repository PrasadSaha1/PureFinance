
function getCheckedValues(checkboxes) {
    return Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.closest('.form-check').querySelector('label').textContent.trim());
    }

document.addEventListener('DOMContentLoaded', function () {
    const goalTypeRadios = document.querySelectorAll('input[name="goal_type"]');
    const amountInput = document.querySelector('#amountDescription input');
    const incomeCategories = document.querySelectorAll('#incomeCategories input[type="checkbox"]');
    const expenseCategories = document.querySelectorAll('#expenseCategories input[type="checkbox"]');
    const goalSummaryText = document.getElementById('goalSummaryText');
    const strongText = document.querySelector('#amountDescription strong');


    function getText(categories){
        var text = "";
        for (var i = 0; i < categories.length; i++) {
            text += categories[i];
             if (i === categories.length - 2) {
                text += " and "; // Add "and" before the last item
            } else if (i < categories.length - 1) {
                text += ", "; // Add a comma and space between items
            }
        }
        console.log(text);

        return text;
    }

    function updateGoalSummary() {
        const goalType = document.querySelector('input[name="goal_type"]:checked').value;
        const amount = amountInput.value;
        const startDate = formatDate(document.querySelector('input[name="start_date"]').value);
        const endDate = formatDate(document.querySelector('input[name="end_date"]').value);

        let summary = '';

        if (goalType === 'general') {
            const incomes = getCheckedValues(incomeCategories);
            const expenses = getCheckedValues(expenseCategories);
            summary = `Accounting for incomes from ${getText(incomes)} and expenses from ${getText(expenses)},
            I would like a net income of $${amount}. `;
        } else if (goalType === 'get_money') {
            const incomes = getCheckedValues(incomeCategories);
            summary = `Accounting for incomes from ${getText(incomes)},
            I would like to obtain $${amount}. `;
        } else if (goalType === 'save_money') {
            const expenses = getCheckedValues(expenseCategories);
            summary = `Accounting for expenses from ${getText(expenses)},
            I would like to spend no more than $${amount}. `;
        }

        // If dates are filled in, include them in the summary
        if (startDate && endDate) {
            summary += `This goal is from ${startDate} to ${endDate}.`;
        } else if (startDate) {
            summary += `This goal starts on ${startDate}.`;
        } else if (endDate) {
            summary += `This goal ends on ${endDate}.`;
        }

        if (!amount) {
            summary = "";
        }

        goalSummaryText.textContent = summary;
    }

    // Update labels and section visibility on goal type change
    goalTypeRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.value === "get_money") {
                strongText.textContent = "Money to Get:";
                document.getElementById("incomeCategories").style.display = "block";
                document.getElementById("expenseCategories").style.display = "none";
            } else if (this.value === "save_money") {
                strongText.textContent = "Max Money to Spend:";
                document.getElementById("incomeCategories").style.display = "none";
                document.getElementById("expenseCategories").style.display = "block";
            } else {
                strongText.textContent = "Net Income:";
                document.getElementById("incomeCategories").style.display = "block";
                document.getElementById("expenseCategories").style.display = "block";
            }
            updateGoalSummary();
        });
    });

    // Update on amount input
    amountInput.addEventListener('input', updateGoalSummary);

    // Update on category checkboxes
    incomeCategories.forEach(cb => cb.addEventListener('change', updateGoalSummary));
    expenseCategories.forEach(cb => cb.addEventListener('change', updateGoalSummary));
    document.querySelector('input[name="start_date"]').addEventListener('change', updateGoalSummary);
    document.querySelector('input[name="end_date"]').addEventListener('change', updateGoalSummary);

    // Call when page loads
    updateGoalSummary();

    

});

document.getElementById('add-goal-btn').addEventListener('click', function () {
    // Collect data from the form
    const goalTitle = document.getElementById('goal-title').value;
    const amount = document.getElementById('goal-amount').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    const goalDescription = document.querySelector("#goalSummaryText").textContent;

    // Get selected goal type
    const goalType = document.querySelector('input[name="goal_type"]:checked').value;

    /*
    const checkedBoxes = document.querySelectorAll('input[name="income_categories"]:checked');

    // Create an array to hold the label text
    const selectedCategoryLabels = [];

    checkedBoxes.forEach(box => {
    const label = document.querySelector(`label[for="${box.id}"]`);
    if (label) {
    selectedCategoryLabels.push(label.textContent.trim());
    }
    });
    console.log(selectedCategoryLabels); // This will log the labels of the selected checkboxes
    */
    const incomeCategories = getCheckedValues(document.querySelectorAll('#incomeCategories input[type="checkbox"]'));
    const expenseCategories = getCheckedValues(document.querySelectorAll('#expenseCategories input[type="checkbox"]'));



    // Prepare data to send
    const data = {
        name: goalTitle,
        amount: amount,
        start_date: startDate,
        end_date: endDate,
        type: goalType,
        income_categories: incomeCategories,
        expense_categories: expenseCategories,
        description: goalDescription,
    };
    // Send AJAX request
    function addGoal(goalName, goalDescription, goalId, status) {
        // Create the goal card element dynamically
        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.id = 'goal-' + goalId;
        goalCard.style = 'flex: 0 0 calc(50% - 0.75rem); padding: 1rem; background: #f8f9fa; border-radius: 0.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1);';
        
        // Set up the content for the goal card
        goalCard.innerHTML = `
            <h3>${goalName}</h3>
            <p>${goalDescription}</p>
            ${getGoalStatus(status)}
        `;

        // Append the new goal card to the container
        const container = document.getElementById('currentGoals');
        if (container) {
            container.appendChild(goalCard); // Append the new goal card inside the container
        }
    }

    function getGoalStatus(status) {
        // Return the appropriate alert based on goal status
        if (status === "failed") {
            return '<div class="alert alert-danger">Goal Failed ($300 was spent in that period)</div>';
        } else if (status === "successful") {
            return '<div class="alert alert-success">Goal Successful ($300 was earned in that period)</div>';
        } else {
            return '<div class="alert alert-warning">Goal in Progress</div>';
        }
    }

    addGoal(data.name, data.description, 100, "in progress"); // Example usage
    
    fetch('/add_goal/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(result => {
        console.log('Goal added successfully:', result);
    })
        
});