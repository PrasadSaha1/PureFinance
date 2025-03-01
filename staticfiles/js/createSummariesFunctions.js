document.addEventListener("DOMContentLoaded", function () {
    // attach event listeners to anything that would changing the filtering 
    document.querySelectorAll('input[name="summaryType"], #custom-value, #custom-unit, #custom-date')
        .forEach(input => {
            input.addEventListener("change", createSummaries);
        });

            // get the buttons and sections to change the visibility of
            const viewAllButton = document.getElementById('toggle-view-all');
            const viewSummariesButton = document.getElementById('toggle-view-summaries');
            const viewAllSection = document.getElementById('view-all-transactions');
            const viewSummariesSection = document.getElementById('view-summaries');
    
            // going from view summaries to view all transactions
            viewAllButton.addEventListener('click', function() {
                viewAllSection.style.display = 'block';  // make all the transactions visible
                viewSummariesSection.style.display = 'none';
                viewAllButton.classList.add('btn-primary');  // turn it from grey to blue
                viewAllButton.classList.remove('btn-secondary');
                viewSummariesButton.classList.add('btn-secondary'); 
                viewSummariesButton.classList.remove('btn-primary');
            });
    
            // going from view all transactions to view summaries
            viewSummariesButton.addEventListener('click', function() {
                viewAllSection.style.display = 'none';
                viewSummariesSection.style.display = 'block';
                viewSummariesButton.classList.add('btn-primary');  // grey to blue
                viewSummariesButton.classList.remove('btn-secondary');
                viewAllButton.classList.add('btn-secondary');
                viewAllButton.classList.remove('btn-primary');
            });

            const customRadioButton = document.getElementById('custom');  // this is the custom option when making summary units
            const customOptions = document.getElementById('custom-options');  // this is the info for making custom summaries
        
            // show the custom options based on if customRadioButton is selected
            customRadioButton.addEventListener('change', () => {
                if (customRadioButton.checked) {
                    customOptions.style.display = 'flex'; // show the options
                } else {
                    customOptions.style.display = 'none'; // hide custom options when other radio is selected
                }
            });
});



function createSummaries() {
    /* This function will create the summaries, called any time there would be a change */

    const tbody = document.querySelector('#summariesTable tbody');
    tbody.innerHTML = ''; // clear existing summaries

    // determine what type of summary the user asked for (week, custom, etc.)
    let summaryType = document.querySelector('input[name="summaryType"]:checked').value;
    if(summaryType === "custom"){
        document.getElementById("noSummariesText").style.display = "none"  // there will be none before the user enters the settings, so we hide this to make it less confusing
        document.getElementById("summariesTable").style.display = ""
        var summarySize = document.getElementById("custom-value").value
        var summarySizeUnit = document.getElementById('custom-unit').value;

        // this dates the custom date and decreases the start time to before 1900 (users can't enter anything before that), as negatives wouldn't behave correclty
        var startTime = decreaseStartTime(document.getElementById('custom-date').value, summarySize, summarySizeUnit);
    }


    if(summaryType === "weekly") {
        summarySize = 7;  // 7 days
        var startTime = "Sun Dec 31 1899";   // by default, the cycle starts on sunday. It is from 1899 to ensure no negative
        var summarySizeUnit = "day"  // every 7 days rather than once per week, makes it more customizeiable with custom options
    } else if (summaryType === "monthly") {
        var startTime = "Mon Jan 1 1900"  // first of the month (and year)
        var summarySize = 1;  // 1 month
        var summarySizeUnit = "month"
    } else if (summaryType === "annually") {
        var startTime = "Mon Jan 1 1900"  // first of the year
        var summarySize = 1;  // 1 year
        var summarySizeUnit = "year"
    }

    var allSummaries = [];
    let currentSummaryStartDate;
    var currentSummaryBalance = 0;

    let transactions = getAllVisibleTransactions();  // only include the transactions on screen

    // sort the transactions by date so that they are proccessed into summaries correclty
    transactions.sort((a, b) => {
        // get the date text from each transaction
        const dateA = a.querySelector('td:nth-child(3)').textContent.trim();
        const dateB = b.querySelector('td:nth-child(3)').textContent.trim();
        
        // make them Date objects
        const dateObjA = new Date(dateA);
        const dateObjB = new Date(dateB);
        
        // compare the Date objects
        return dateObjA - dateObjB;
    });

    transactions.forEach(transaction => {
        // remember that querySelector is one-based
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
        const formattedDate = new Date(transactionDate);  // Parse the date
        // formattedDate looks like Mon Jan 27 2025 00:00:00 GMT-0500 (Eastern Standard Time)

        const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();  // positive string with $
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();   // income_source or expense 
       
        // this is the start date of that summary. For example, if the transactionDate (used due to differing formats) is Wednesday and the summary is weekly on sundays, it would turn it to that Sunday
        var summaryStartDate = getSummaryStartDate(startTime, transactionDate, summarySize, summarySizeUnit)
       
        if (!currentSummaryStartDate) {  // if there is no currentSummaryStartDate (this is the first summary)
            currentSummaryStartDate = summaryStartDate;  // make the current one it, and format it
            currentSummaryStartDate = new Date(currentSummaryStartDate)
        }

        // get the difference between the current date and the start of the current summary
        let difference = getDateDifference(currentSummaryStartDate, formattedDate);

        // if the difference is more than one summary period, make a new one
        if (difference.days >= summarySize && summarySizeUnit === "day" ||
            difference.months >= summarySize && summarySizeUnit === "month" ||
            difference.years >= summarySize && summarySizeUnit === "year" ) {
            
            // add to all summaries
            allSummaries.push([currentSummaryStartDate, currentSummaryBalance]);
            
            // reset for the next summary period
            currentSummaryStartDate = summaryStartDate;
            currentSummaryBalance = 0;
        }
    
        // trim the balances and add or subtract them as needed
        if (transactionType === "income_source") {
            currentSummaryBalance += parseFloat(transactionAmount.replace('$', '').replace(/,/g, '').trim());
        } else {
            currentSummaryBalance -= parseFloat(transactionAmount.replace('$', '').replace(/,/g, '').trim());
        }

    });
    // at the end, add a summary
    allSummaries.push([currentSummaryStartDate, currentSummaryBalance])
    // sorting the summaries
    const sortOption = document.querySelector('input[name="transactionSort"]:checked').value;
    allSummaries.sort((a, b) => {
        switch (sortOption) {
            case 'byAmountLH':  // low to high amount
                return Math.abs(a[1]) - Math.abs(b[1]);
            case 'byAmountHL':  // high to low amount
                return Math.abs(b[1]) - Math.abs(a[1]);
            case 'byDateLM':  // least recent to most recent start date
                return new Date(a[0]) - new Date(b[0]);
            default: // most to least recent date. This will also occur when they sort alphabetically, which wouldn't make sense
                return new Date(b[0]) - new Date(a[0]);
        }
    });
    


    if (transactions.length > 0) {  // if there's more than one transaction, display the summaryies
        allSummaries.forEach(summary => {
            const rowClass = summary[1] > 0 ? 'green' : 'red';  // determine the colors

            // from the second date, one is being subtracted as adding the amount would be the start of the next cycle
            const row = `
                <tr class="${rowClass}" name="summaries">
                    <td>${formatDateFromISO(getStartDate(summary[0]))}</td>
                    <td>${formatDateFromISO(getEndDate(summary[0], summarySize, summarySizeUnit))}</td>
                    <td>$${formatMoney(summary[1])}</td> 
                </tr>
            `;
            tbody.innerHTML += row;  // add the row
        });
    }

    if (allSummaries.length === 0 || transactions.length === 0){  // if there's nothing, display that nothing text
        document.getElementById("noSummariesText").style.display = ""
        document.getElementById("summariesTable").style.display = "none"
    } else {  // display the summaries
        document.getElementById("noSummariesText").style.display = "none"
        document.getElementById("summariesTable").style.display = ""
    }


}

