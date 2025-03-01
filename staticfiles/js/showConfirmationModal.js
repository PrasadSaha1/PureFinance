function handleFormSubmit(event, form, message) {
    // this function will have a form go through the confirmation modal before submitting

    event.preventDefault(); // prevent form submission

    showConfirmationModal(message).then((confirmed) => {
        if (confirmed) {
            form.submit();
        } 
    });
}

function showConfirmationModal(message, forOutputReport = false) {
    return new Promise((resolve) => {
        // set message and show modal
        document.querySelector('.modal-body').textContent = message;
        if (forOutputReport){  // there would be no text
            document.getElementById('modalTextInput').style.display = "";
        } else {
            document.getElementById('modalTextInput').style.display = "none";
        }
        document.getElementById("modalTextError").style.display = "none"  // hide the error message

        let confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        confirmationModal.show();

        document.getElementById('cancelButton').onclick = function() {
            confirmationModal.hide();
            resolve(false); // stop the action
        };

        // confirm button
        document.getElementById('confirmActionButton').onclick = function() {
            if (forOutputReport) {
                var userInput = document.getElementById("userInput").value.trim();
                var errorText = document.getElementById("modalTextError");
    
                if (userInput === "") {  // add the error
                    errorText.style.display = "block"; 
                } else {
                    confirmationModal.hide();
                    resolve(userInput); // return the user input for the output report to use
                }
            } else {
                confirmationModal.hide();
                resolve(true); 
            }
        };
    });
}
