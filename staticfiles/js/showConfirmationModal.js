function handleFormSubmit(event, form, message) {
    event.preventDefault(); // Prevent form submission

    showConfirmationModal(message).then((confirmed) => {
        if (confirmed) {
            form.submit();
        } 
    });
}

function showConfirmationModal(message, forOutputReport = false) {
    return new Promise((resolve) => {
        // Set message and show modal
        document.querySelector('.modal-body').textContent = message;
        if (forOutputReport){
            document.getElementById('modalTextInput').style.display = "";
        } else {
            document.getElementById('modalTextInput').style.display = "none";
        }
        document.getElementById("modalTextError").style.display = "none"

        let confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();

        // Handle cancel button
        document.getElementById('cancelButton').onclick = function() {
            confirmationModal.hide();
            resolve(false); // Reject action
        };

        // Handle confirm button
        document.getElementById('confirmActionButton').onclick = function() {
            if (forOutputReport) {
                var userInput = document.getElementById("userInput").value.trim();
                var errorText = document.getElementById("modalTextError");
    
                if (userInput === "") {
                    errorText.style.display = "block"; 
                } else {
                    confirmationModal.hide();
                    resolve(userInput); // Resolve with user input if valid
                }
            } else {
                confirmationModal.hide();
                resolve(true); // Confirm action
            }
        };
    });
}
