let currentForm = null;

function handleFormSubmit(event, form, message) {
    event.preventDefault(); // Prevent form submission

    // Check if the user opted out
    if (localStorage.getItem("skipConfirmation") === "true") {
        form.submit(); // Directly submit without showing modal
        return;
    }

    showConfirmationModal(form, message).then((confirmed) => {
        if (confirmed) {
            form.submit(); // Submit form only if user confirmed
        }
    });
}

function showConfirmationModal(form, message) {
    return new Promise((resolve) => {
        if (localStorage.getItem("skipConfirmation") === "true") {
            resolve(true)
        }
        else {
            currentForm = form; // Store the form

            // Set message and show modal
            document.querySelector('.modal-body').textContent = message;
            let confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
            confirmationModal.show();

            // Handle cancel button
            document.getElementById('cancelButton').onclick = function() {
                confirmationModal.hide();
                resolve(false); // User canceled
            };

            // Handle confirm button
            document.getElementById('confirmActionButton').onclick = function() {
                // Check if "Don't ask me again" is selected
                if (document.getElementById('dontAskAgain').checked) {
                    localStorage.setItem("skipConfirmation", "true"); // Store preference
                }

                confirmationModal.hide();
                resolve(true); // User confirmed
            }
        };
    });
}
