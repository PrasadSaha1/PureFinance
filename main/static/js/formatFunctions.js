function formatDate(value) {
    // this function formats a date from YYYY-MM-DD to Mon. Day, Year  - the same as the default
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

    const year = parseInt(value.split('-')[0]);  // get the year
    const month = parseInt(value.split('-')[1]);  // get the month
    const day = parseInt(value.split('-')[2]);  // get the day

    // this gets the suffix given the day (returns day + suffix)
    /*
    function getDayWithSuffix(day) {
        // if mod 10 is 1, ends in st
        // if mod 10 is 2, ends in nd
        // if mod 10 is 3, ends in rd
        // else, ends in th
        // 11-13 also end in th
        return day
        if (day >= 11 && day <= 13) { 
            return day + "th";
        }
        switch (day % 10) {  
            case 1:
                return day + "st";
            case 2:
                return day + "nd";
            case 3:
                return day + "rd";
            default:
                return day + "th";
        }
    }
        */
    // returns the formatted date. 1 is subtracted from the month as it is zero-based
    return `${months[month-1].slice(0, 3)}. ${day}, ${year}`;
}


function formatTransactionDate(dateString) {
    /*
    const date = new Date(dateString);
    
    // Extract year, month, and day
    const year = date.getFullYear();
    let month = date.getMonth() + 1; // Months are zero-indexed
    let day = date.getDate();
    
    // Pad month and day with leading zeros if needed
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    
    return `${year}-${month}-${day}`;
    */
   return dateString
}
    
function decreaseStartTime(date, summarySize, summarySizeUnit) {
    date = new Date(date);
    const DAYSSINCE1900 = 5000;
    const MONTHSSINCE1900 = 200;
    const YEARSSINCE1900 = 20;

    if (summarySizeUnit === "day") {
        date.setDate(date.getDate() - summarySize * DAYSSINCE1900 + 1);
        return new Date(date.toDateString());
    } else if (summarySizeUnit === "month") {
        date.setMonth(date.getMonth() - summarySize * MONTHSSINCE1900);
        return new Date(date).toDateString();
    } else if (summarySizeUnit === "year") {
        date.setFullYear(date.getFullYear() - summarySize * YEARSSINCE1900);
        return new Date(date).toDateString();
    }
}


function getNewDate(startDate, currentDate, unitSummaryDifference, summaryUnit) {
    startDate = new Date(startDate);
    currentDate = new Date(currentDate);

    var dateDifference = getDateDifference(startDate, currentDate);

    if (summaryUnit === "day") {
        var entireDifference = Math.abs(dateDifference.days);  // take the abs as mod works differnetly with negatives, which we don't want
        var daysToSubtract = entireDifference % unitSummaryDifference;
        currentDate.setDate(currentDate.getDate() - daysToSubtract);
    } else if (summaryUnit === "month") {
        var entireDifference = Math.abs(dateDifference.months);  // take the abs as mod works differnetly with negatives, which we don't want
        var monthsToSubtract = entireDifference % unitSummaryDifference;

        currentDate.setMonth(currentDate.getMonth() - monthsToSubtract);
        // Set to the 1st of the month
        currentDate.setDate(1);
    } else {
        var entireDifference = Math.abs(dateDifference.years);  // take the abs as mod works differnetly with negatives, which we don't want
        var yearsToSubtract = entireDifference % unitSummaryDifference;
        currentDate.setFullYear(currentDate.getFullYear() - Math.abs(yearsToSubtract));

        // Set to January 1st of that year
        currentDate.setMonth(0); // January is month 0 in JS
        currentDate.setDate(1);
    }
    return currentDate;
}


function formatDateFromISO(dateString) {
    const date = new Date(dateString);
    const options = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    };
    
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

    // Custom formatting to add the period after the month abbreviation
    const [month, day, year] = formattedDate.split(' ');
    return `${month}. ${day} ${year}`;
}

function getStartDate(date) {
    var startDateFromFilter = document.getElementById('start-date').value;  // get the start and end dates
    var filterByDate = document.getElementById('date-filter-checkbox').checked
    if (startDateFromFilter && filterByDate){
        var intervalStart = new Date(date);
        var startDateFromFilter = new Date(startDateFromFilter);

        intervalStart.setDate(intervalStart.getDate());
        startDateFromFilter.setDate(startDateFromFilter.getDate() + 1);

        return intervalStart > startDateFromFilter ? intervalStart : startDateFromFilter;
    }
    return date

}

function getEndDate(date, unitsToAdd, unit) {
    var newDate = new Date(date);  // Create a copy of the date
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
    
    var endDateFromFilter = document.getElementById('end-date').value;  // get the start and end dates
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
    // Convert input to Date objects
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Calculate total difference in time and days
    const differenceInTime = endDate.getTime() - startDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24)); 

    // Extract date components
    let startMonth = startDate.getMonth();
    let startYear = startDate.getFullYear();

    let endMonth = endDate.getMonth();
    let endYear = endDate.getFullYear();

    // Calculate year difference
    let yearDiff = endYear - startYear;
    let monthDiff = endMonth - startMonth + yearDiff * 12;

    return {
        years: yearDiff,
        months: monthDiff,
        days: differenceInDays,
    };
}


function formatMoney(value) {
    // Converts a float to money (doesn't include dollar sign)
    value = parseFloat(value); // Convert to a float
//    if (takeAbsolute) {  
 //       value = Math.abs(value);
  //  }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validatePositiveNumber(input) {
  var value = input.value.replace(/[^0-9.]/g, '');
  var parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join(''); // Keep only first '.'
  }
  input.value = value;
}