function searchQuestions() {
    // Get the search input and convert it to lowercase
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    
    const headers = document.querySelectorAll('.sectionHeaders'); // Use querySelectorAll to select all headers
    if (query) {
        headers.forEach(function(header) {
            header.style.display = "none"; // Hide all headers if query is truthy
        });
    } else {
        headers.forEach(function(header) {
            header.style.display = ""; // Show all headers if query is falsy
        });
    }
        
    // Get all the question buttons
    const items = document.querySelectorAll('.accordion-header');
    
    items.forEach(function(question) {
        // Check if the question contains the search query
        const questionText = question.innerText.toLowerCase();
        
        // Show or hide the question based on whether it matches the query
        if (questionText.includes(query)) {
            question.closest('.accordion-item').style.display = '';
        } else {
            question.closest('.accordion-item').style.display = 'none';
        }
    });
}

function toggleAccordion(expand) {
    
        const allAccordions = document.querySelectorAll('.accordion-collapse');
        const allButtons = document.querySelectorAll('.accordion-button');
        
        allAccordions.forEach((accordion) => {
            if (expand) {
                new bootstrap.Collapse(accordion, { toggle: true });
            } else {
                if (accordion.classList.contains('show')) {
                    new bootstrap.Collapse(accordion, { toggle: true });
                }
            }
        });

        allButtons.forEach((button) => {
            if (expand) {
                button.setAttribute('aria-expanded', 'true');
            } else {
                button.setAttribute('aria-expanded', 'false');
            }
        });

        // Change button text based on action
        if (expand) {
            document.getElementById('expandAll').style.display = 'none';
            document.getElementById('collapseAll').style.display = 'inline-block';
        } else {
            document.getElementById('expandAll').style.display = 'inline-block';
            document.getElementById('collapseAll').style.display = 'none';
        }
                        

    }
