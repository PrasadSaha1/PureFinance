function searchQuestions() {
    /* Controls the search feature of the FAQ */

    // make it lowercase to expand the amount of posibilties
    const query = document.getElementById('searchInput').value.toLowerCase();
        
    // get all the headers. If the query is not blank, hide them, else show them
    // the headers are hiden to make the code cleanr
    const headers = document.querySelectorAll('.sectionHeaders'); 
    if (query) {
        headers.forEach(function(header) {
            header.style.display = "none"; 
        });
    } else {
        headers.forEach(function(header) {
            header.style.display = ""; 
        });
    }
        
    // getting all the questions
    const items = document.querySelectorAll('.accordion-header');
    
    items.forEach(function(question) {
        // check if the question contains the search query
        const questionText = question.innerText.toLowerCase();
        
        // show or hide the question based on whether it matches the query
        if (questionText.includes(query)) {
            question.closest('.accordion-item').style.display = '';
        } else {
            question.closest('.accordion-item').style.display = 'none';
        }
    });
}

function toggleAccordion(expand) {
    /* Toggles accoridan for viewing the FAQ secctions */

    const allAccordions = document.querySelectorAll('.accordion-collapse');  // this is information within the class
    const allButtons = document.querySelectorAll('.accordion-button');  // these are the according buttons
    
    allAccordions.forEach((accordion) => {
        let bootstrapCollapse = new bootstrap.Collapse(accordion, { toggle: false });  // make a new bootstrap collapse object
    
        if (expand) {
            bootstrapCollapse.show(); // make it expand
        } else {
            bootstrapCollapse.hide(); // make it collapse
        }
    });

    allButtons.forEach((button) => {
        // determines aria-expanded, useful for accesbility
        if (expand) {
            button.setAttribute('aria-expanded', 'true');
        } else {
            button.setAttribute('aria-expanded', 'false');
        }
    });
}
