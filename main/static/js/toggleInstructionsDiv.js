document.getElementById("toggleInstructionsBtn").addEventListener("click", function() {
    var instructionsDiv = document.getElementById("instructionsDivContent");
    var toggleInstructionsBtn = document.getElementById("toggleInstructionsBtn")
    // Toggle the display of the instructions div
    if (instructionsDiv.style.display === "none") {
        toggleInstructionsBtn.textContent = "Hide"
        instructionsDiv.style.display = "block";
    } else {
        toggleInstructionsBtn.textContent = "Show"
        instructionsDiv.style.display = "none";
    }
});
