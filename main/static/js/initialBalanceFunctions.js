document.addEventListener("DOMContentLoaded", function () {



    document.getElementById("editInitialBalanceBtn").addEventListener("click", function() {
        const balanceDisplay = document.getElementById("initialBalance");
        const balanceInput = document.getElementById("initialBalanceInput");
        const balanceSignOptions = document.getElementById("balanceSignOptions"); // Get the div with radio buttons
        const editButton = document.getElementById("editInitialBalanceBtn");
        const cancelButton = document.getElementById("cancelInitialBalanceBtn");

        if (balanceInput.classList.contains("d-none")) {
            // Switch to edit mode
            balanceDisplay.classList.add("d-none");
            balanceInput.classList.remove("d-none");
            balanceSignOptions.classList.remove("d-none"); // Show the radio buttons
            editButton.textContent = "Save";
            cancelButton.classList.remove("d-none");
        } else {
            // Switch to view mode
            let newBalance = parseFloat(balanceInput.value);
            
            // Apply the selected sign (positive or negative)
            const isNegative = document.getElementById("negativeBalance").checked;
            if (isNegative) {
                newBalance = -Math.abs(newBalance);
            }

            balanceDisplay.textContent = `$${newBalance.toFixed(2)}`;
            balanceDisplay.classList.remove("d-none");
            balanceInput.classList.add("d-none");
            balanceSignOptions.classList.add("d-none"); // Hide the radio buttons
            editButton.textContent = "Edit";
            cancelButton.classList.add("d-none");

            updateCurrentBalance();
            
            // Save the new balance
            fetch("/add_initial_balance/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "amount": newBalance })  // Send the updated balance
            });
        }
    });

    document.getElementById("cancelInitialBalanceBtn").addEventListener("click", cancelEditInitialBalance) 
});

function cancelEditInitialBalance(){
    const balanceDisplay = document.getElementById("initialBalance");
    const balanceInput = document.getElementById("initialBalanceInput");
    const editButton = document.getElementById("editInitialBalanceBtn");
    const cancelButton = document.getElementById("cancelInitialBalanceBtn");

    const balanceSignOptions = document.getElementById("balanceSignOptions"); // Get the div with radio buttons

    // Revert to the original balance and hide input
    balanceDisplay.classList.remove("d-none");
    balanceInput.classList.add("d-none");
    editButton.textContent = "Edit";
    cancelButton.classList.add("d-none");
    balanceSignOptions.classList.add("d-none")
}
