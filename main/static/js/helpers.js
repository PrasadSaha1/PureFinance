function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function formatDate(value) {
    // this function formats a date from YYYY-MM-DD to Month Day(th), Year
    // this is done with a template tag, but it did not behave correctly in js

    // array of months
    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
        ];

    const year = parseInt(value.split('-')[0]);  // get the year
    const month = parseInt(value.split('-')[1]);  // get the month
    const day = parseInt(value.split('-')[2]);  // get the day

    // this gets the suffix given the day (returns day + suffix)
    function getDayWithSuffix(day) {
        // if mod 10 is 1, ends in st
        // if mod 10 is 2, ends in nd
        // if mod 10 is 3, ends in rd
        // else, ends in th
        // 11-13 also end in th
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

    // get the day and suffix
    const dayWithSuffix = getDayWithSuffix(day);

    // returns the formatted date. 1 is subtracted from the month as it is zero-based
    return `${months[month-1]} ${dayWithSuffix}, ${year}`;
}

function formatTransactionDate(dateString) {
    const date = new Date(dateString);
    
    // Extract year, month, and day
    const year = date.getFullYear();
    let month = date.getMonth() + 1; // Months are zero-indexed
    let day = date.getDate();
    
    // Pad month and day with leading zeros if needed
    month = month < 10 ? '0' + month : month;
    day = day < 10 ? '0' + day : day;
    
    return `${year}-${month}-${day}`;
}

function formatMoney(value) {
    value = parseFloat(value); // Convert to a float
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }