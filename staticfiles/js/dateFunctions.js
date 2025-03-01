function formatDate(value) {
    // this function formats a date from YYYY-MM-DD to Mon. Day, Year  - the same as the default
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

    const year = parseInt(value.split('-')[0]);  // get the year
    const month = parseInt(value.split('-')[1]);  // get the month
    const day = parseInt(value.split('-')[2]);  // get the day

    // returns the formatted date. 1 is subtracted from the month as it is zero-based
    return `${months[month-1].slice(0, 3)}. ${day}, ${year}`;
}

    
function decreaseStartTime(date, summarySize, summarySizeUnit) {
    /* Decrease a custom start time to a date before 1900 to ensure nothnig is before it */

    date = new Date(date);
    const DAYSUBTRACT = 5000;  // these constants, when mutlipled, represent safe intervals. The date can't go below 0 AD or else it will become buggy
    const MONTHSUBTRACT = 200;
    const YEARSUBTRACT = 20;

    if (summarySizeUnit === "day") {
        // take the given date and subtract is as needed
        date.setDate(date.getDate() - summarySize * DAYSUBTRACT + 1);  // +1 due to time zones
        return new Date(date.toDateString());  // return a Date object
    } else if (summarySizeUnit === "month") {
        date.setMonth(date.getMonth() - summarySize * MONTHSUBTRACT);
        return new Date(date).toDateString();
    } else if (summarySizeUnit === "year") {
        date.setFullYear(date.getFullYear() - summarySize * YEARSUBTRACT);
        return new Date(date).toDateString();
    }
}

function getSummaryStartDate(referenceDate, currentDate, summarySize, summaryUnit) {
    // gets the start date for a summary given the summary period size, reference date, and summary unit

    referenceDate = new Date(referenceDate);
    currentDate = new Date(currentDate);

    // differnce between reference date and summary date
    var dateDifference = getDateDifference(referenceDate, currentDate);

    if (summaryUnit === "day") {
        var entireDifference = Math.abs(dateDifference.days);  // take the abs as mod works differnetly with negatives, as a fail-safe
        var daysToSubtract = entireDifference % summarySize;  // amount to subtract to get the correct multiple
        currentDate.setDate(currentDate.getDate() - daysToSubtract);
    } else if (summaryUnit === "month") {
        var entireDifference = Math.abs(dateDifference.months);  // take the abs as mod works differnetly with negatives, as a fail-safe
        var monthsToSubtract = entireDifference % summarySize;

        currentDate.setMonth(currentDate.getMonth() - monthsToSubtract);
        // set to the 1st of the month
        currentDate.setDate(1);
    } else {
        var entireDifference = Math.abs(dateDifference.years);  // take the abs as mod works differnetly with negatives, as a fail-safe
        var yearsToSubtract = entireDifference % summarySize;
        currentDate.setFullYear(currentDate.getFullYear() - Math.abs(yearsToSubtract));

        // set to January 1st of that year
        currentDate.setMonth(0); // January is month 0 in JS
        currentDate.setDate(1);
    }
    return currentDate;
}

function formatDateFromISO(dateString) {
    /* from ISO date to Mon. day, year  
    Used in create summaries*/
    const date = new Date(dateString);
    const options = {   
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    };
    
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    // split the formatted Date and return
    const [month, day, year] = formattedDate.split(' ');
    return `${month}. ${day} ${year}`;
}

function getStartDate(date) {
    /* if there's a start date in the filter, make it so that the summary can't start before that. else, return the input */
    var startDateFromFilter = document.getElementById('start-date').value;  // get the start date
    var filterByDate = document.getElementById('date-filter-checkbox').checked
    if (startDateFromFilter && filterByDate){  // if there's a valid start date and the filter is checked
        var intervalStart = new Date(date);  // format the dates
        var startDateFromFilter = new Date(startDateFromFilter);

        intervalStart.setDate(intervalStart.getDate());  // format the dates and account for time zones
        startDateFromFilter.setDate(startDateFromFilter.getDate() + 1);

        // if the start date from filter is after the interval start, return that
        return intervalStart > startDateFromFilter ? intervalStart : startDateFromFilter;
    }
    return date  // return the input by default

}

function getEndDate(date, unitsToAdd, unit) {
    /* Gets the end of the summary period */

    var newDate = new Date(date);  // parse the date
    unitsToAdd --;  // make it the end of the current, not the start of the next
    if (unit === "day") {
        newDate.setDate(newDate.getDate() + unitsToAdd);
    } else if (unit === "month") {
        newDate.setMonth(newDate.getMonth() + unitsToAdd + 1);
        newDate.setDate(0); // Go back to the last day of the previous month
    } else if (unit === "year") {
        newDate.setFullYear(newDate.getFullYear() + unitsToAdd);
        newDate.setMonth(11); // December
        newDate.setDate(31);  // 31st day
    }
    

    // similar to the start date, the end date can not be after the end date of the filter
    var endDateFromFilter = document.getElementById('end-date').value;  // get the end date
    var filterByDate = document.getElementById('date-filter-checkbox').checked
    if (endDateFromFilter && filterByDate){
        var endDateFromFilter = new Date(endDateFromFilter);

        newDate.setDate(newDate.getDate());
        endDateFromFilter.setDate(endDateFromFilter.getDate() + 1);

        return newDate < endDateFromFilter ? newDate : endDateFromFilter;
    }

    return newDate;
}

function getDateDifference(startDate, endDate) {
    // gets the difference between two dates

    // parse them
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // calculate total difference in time and days
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24)); 

    // get date components
    let startMonth = startDate.getMonth();
    let startYear = startDate.getFullYear();

    let endMonth = endDate.getMonth();
    let endYear = endDate.getFullYear();

    // calculate year difference
    let yearDiff = endYear - startYear;
    let monthDiff = endMonth - startMonth + yearDiff * 12;

    return {
        years: yearDiff,
        months: monthDiff,
        days: differenceInDays,
    };
}
