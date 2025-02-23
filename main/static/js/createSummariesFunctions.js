document.addEventListener("DOMContentLoaded", function () {
    // attach event listeners to anything that would changing the filtering 
    document.querySelectorAll('input[name="summaryType"], #custom-value, #custom-unit, #custom-date')
        .forEach(input => {
            input.addEventListener("change", createSummaries);
        });

            const viewAllButton = document.getElementById('toggle-view-all');
            const viewSummariesButton = document.getElementById('toggle-view-summaries');
            const viewAllSection = document.getElementById('view-all-transactions');
            const viewSummariesSection = document.getElementById('view-summaries');
    
            // Event listener for "View All Transactions" button
            viewAllButton.addEventListener('click', function() {
                viewAllSection.style.display = 'block';
                viewSummariesSection.style.display = 'none';
                viewAllButton.classList.add('btn-primary');
                viewAllButton.classList.remove('btn-secondary');
                viewSummariesButton.classList.add('btn-secondary');
                viewSummariesButton.classList.remove('btn-primary');
            });
    
            // Event listener for "View Summaries" button
            viewSummariesButton.addEventListener('click', function() {
                viewAllSection.style.display = 'none';
                viewSummariesSection.style.display = 'block';
                viewSummariesButton.classList.add('btn-primary');
                viewSummariesButton.classList.remove('btn-secondary');
                viewAllButton.classList.add('btn-secondary');
                viewAllButton.classList.remove('btn-primary');
            });

            const customRadioButton = document.getElementById('custom');
            const customOptions = document.getElementById('custom-options');
        
            // Show the custom input section when 'Custom' is selected
            customRadioButton.addEventListener('change', () => {
                if (customRadioButton.checked) {
                    customOptions.style.display = 'flex'; // Show custom options
                } else {
                    customOptions.style.display = 'none'; // Hide custom options when other radio is selected
                }
            });
        
            // Handle other radio button selections (optional)
            const weeklyRadioButton = document.getElementById('weekly');
            const monthlyRadioButton = document.getElementById('monthly');
            const annuallyRadioButton = document.getElementById('annually');
        
            // Add event listeners to hide custom options when other types are selected
            weeklyRadioButton.addEventListener('change', () => {
                customOptions.style.display = 'none';
            });
            monthlyRadioButton.addEventListener('change', () => {
                customOptions.style.display = 'none';
            });
            annuallyRadioButton.addEventListener('change', () => {
                customOptions.style.display = 'none';
            });
        
});



function createSummaries() {
    const tbody = document.querySelector('#summariesTable tbody');
    tbody.innerHTML = ''; // Clear existing rows

    let checkedValue = document.querySelector('input[name="summaryType"]:checked').value;
    if(checkedValue === "custom"){
        document.getElementById("noSummariesText").style.display = "none"
        document.getElementById("summariesTable").style.display = ""
        var summarySize = document.getElementById("custom-value").value
        var summarySizeUnit = document.getElementById('custom-unit').value;
        var startTime = decreaseStartTime(document.getElementById('custom-date').value, summarySize, summarySizeUnit);
    }


    if(checkedValue === "weekly") {
        summarySize = 7;
        var startTime = "Sun Dec 31 1899";   // if values are before this date, they will be negative. That is fine
        var summarySizeUnit = "day" 
    } else if (checkedValue === "monthly") {
        var startTime = "Mon Jan 1 1900"
        var summarySize = 1;
        var summarySizeUnit = "month"
    } else if (checkedValue === "annually") {
        var startTime = "Mon Jan 1 1900"
        var summarySize = 1;
        var summarySizeUnit = "year"
    }

    var allSummaries = [];
    // var summaryTemporaryStorage = [];
    let currentSummaryStartDate;
    var currentSummaryBalance = 0;

    let transactions = getAllVisibleTransactions();  // only include the transactions on screen

    // sort the transactions by date
    transactions.sort((a, b) => {
        // Get the date text from each transaction
        const dateA = a.querySelector('td:nth-child(3)').textContent.trim();
        const dateB = b.querySelector('td:nth-child(3)').textContent.trim();
        
        // Convert the date text to Date objects
        const dateObjA = new Date(dateA);
        const dateObjB = new Date(dateB);
        
        // Compare the Date objects
        return dateObjA - dateObjB;
    });


    transactions.forEach(transaction => {
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
        const formattedDate = new Date(transactionDate);  // Parse the date string into a Date object

        const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();  
       
        var newDate = getNewDate(startTime, transactionDate, summarySize, summarySizeUnit)
       if (!currentSummaryStartDate) {
            currentSummaryStartDate = newDate;
            currentSummaryStartDate = new Date(currentSummaryStartDate)
        }
        let difference = getDateDifference(currentSummaryStartDate, formattedDate);

        if (difference.days >= summarySize && summarySizeUnit === "day" ||
            difference.months >= summarySize && summarySizeUnit === "month" ||
            difference.years >= summarySize && summarySizeUnit === "year" ) {
            // Add the current summary to the allSummaries array if the condition is met
            allSummaries.push([currentSummaryStartDate, currentSummaryBalance]);
            
            // Reset for the next summary period
            currentSummaryStartDate = newDate;
            currentSummaryBalance = 0;
        }
    


        // trim the balances and add or subtract them as needed
        if (transactionType === "income_source") {
            currentSummaryBalance += parseFloat(transactionAmount.replace('$', '').replace(/,/g, '').trim());
        } else {
            currentSummaryBalance -= parseFloat(transactionAmount.replace('$', '').replace(/,/g, '').trim());
        }

    });
    allSummaries.push([currentSummaryStartDate, currentSummaryBalance])

    if (transactions.length > 0) {
        allSummaries.forEach(summary => {
            const rowClass = summary[1] > 0 ? 'green' : 'red';

            // the true parameter for the money makes it an absolute value
            // from the second date, one is being subtracted as adding the amount would be the start of the next cycle
            const row = `
                <tr class="${rowClass}" name="summaries">
                    <td>${formatDateFromISO(getStartDate(summary[0]))}</td>
                    <td>${formatDateFromISO(getEndDate(summary[0], summarySize, summarySizeUnit))}</td>
                    <td>$${formatMoney(summary[1], true)}</td> 
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    if (allSummaries.length === 0 || transactions.length === 0){
        document.getElementById("noSummariesText").style.display = ""
        document.getElementById("summariesTable").style.display = "none"
    } else {
        document.getElementById("noSummariesText").style.display = "none"
        document.getElementById("summariesTable").style.display = ""
    }


}



        /*
      //  const rowClass = transaction.transaction_type === 'income_source' ? 'green' : 'red';
        
      
      // const categoryName = transaction.transaction_category?.category_name || 'No Category';
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();  // select the 5th <td> (Amount cell)
        const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();  // select the 5th <td> (Amount cell)
        const rowClass = transactionType === 'income_source' ? 'green' : 'red';

        const row = `
            <tr class="${rowClass}" name="summaries">
                <td>${transactionDate}</td>
                <td>${transactionDate}</td>
                <td>${transactionAmount}</td>
            </tr>
        `;
        tbody.innerHTML += row;
        */