function formatMoney(value) {
    // Converts a float to money (doesn't include dollar sign)
    value = parseFloat(value); // Convert to a float
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function validatePositiveNumber(input) {
    /* removes symbols from numbers, which are given as text */
    var value = input.value.replace(/[^0-9.]/g, '');  // get rid of symbols from the text
    var parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join(''); // keep only first '.'
    }
    input.value = value;  // update
}