document.addEventListener('DOMContentLoaded', function() {
    const exportToPDFBtn = document.getElementById('export-to-pdf');

    exportToPDFBtn.addEventListener('click', makeTransactionsPDF)
});

function makeTransactionsPDF(){
    /* This makes the PDF for when the user has transactions selected, rather than summaries*/

    //  making a PDF with JsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("times") // times new roman
    
   createHeader(doc);
   doc.setFontSize(12);

   
   // yPos += 8
   let selectedTypes = getCheckedTransactionTypes();
   includeIncome = false;
   includeExpense = false;

   if (selectedTypes.includes("income_source-filter")){
    includeIncome = true;
   }
   if (selectedTypes.includes("expense-filter")){
    includeExpense = true;
   }

   let includeInitialBalance = document.getElementById("include-initial-balance").checked;

   let yPos = 70;
   yPos += createMultipleTextOneLine(doc, "Report Type:", "Raw Transactions", "Summaries", yPos, true, false)
   yPos += createMultipleTextOneLine(doc, "Transaction Types Included:", "Incomes", "Expenses", yPos, includeIncome, includeExpense)
   yPos += createMultipleTextOneLine(doc, "Includes Initial Balance:", "Yes", "No", yPos, includeInitialBalance, !includeInitialBalance)

   const categoryCheckboxes = getAllCategoryCheckboxes()
   const pageWidth = doc.internal.pageSize.getWidth();

   var incomeCheckedCategories = [];
   var incomeUncheckedCategories = [];
   var expenseCheckedCategories = [];
   var expenseUncheckedCategories = []

   categoryCheckboxes.forEach(checkbox => {
    var checkboxValueSplit = checkbox.value.split("-")
    if (checkboxValueSplit[0] !== "No Category") {
        if (checkbox.checked){
            if (checkboxValueSplit[1] === "income_source"){
                incomeCheckedCategories.push(checkboxValueSplit[0])
            } else {
                expenseCheckedCategories.push(checkboxValueSplit[0])
            }
        } else {
            if (checkboxValueSplit[1] === "income_source"){
                incomeUncheckedCategories.push(checkboxValueSplit[0])
            } else {
                expenseUncheckedCategories.push(checkboxValueSplit[0])
            }
        }
    }
    });

    
   var formattedCheckedIncomeCategories = incomeCheckedCategories.join("| ") || "None";
   var formattedUncheckedIncomeCategories = incomeUncheckedCategories.join("| ") || "None";
   var formattedCheckedExpenseCategories = expenseCheckedCategories.join("| ") || "None";
   var formattedUncheckedExpenseCategories = expenseUncheckedCategories.join(" ") || "None";

    yPos += createMultipleTextOneLine(doc, `Income Categories Included: |${formattedCheckedIncomeCategories}`, `Expense Categories Included: |${formattedCheckedExpenseCategories}`, "", yPos)

    yPos += createMultipleTextOneLine(doc, `Income Categories Excluded: |${formattedUncheckedIncomeCategories}`, `Expense Categories Excluded: |${formattedUncheckedExpenseCategories}`, "", yPos)


    var startDate = "All Dates"
    var endDate = "All Dates"
    const dateToggle = document.getElementById('date-filter-checkbox');
    if (dateToggle.checked) {
        startDate = document.getElementById('start-date').value;  // get the start and end dates
        endDate = document.getElementById('end-date').value;
        startDate = formatDate(startDate);
        endDate = formatDate(endDate)
    }    

    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20;

    var lowPrice = "All Prices";
    var highPrice = "All Prices";
    const priceToggle = document.getElementById('price-filter-checkbox');
    if (priceToggle.checked){
        lowPrice = document.getElementById('low-price').value;
        highPrice = document.getElementById('high-price').value;
        lowPrice = `$${formatMoney(lowPrice)}`;
        highPrice = `$${formatMoney(highPrice)}`;
    }

    const sortOption = document.querySelector('input[name="transactionSort"]:checked').value;
    var sortText = "";
    switch (sortOption) {
        case 'byNameAZ':  // alphabetical name
            sortText = "By Name (A-Z)";
            break;
        case 'byNameZA':  // reverse name
            sortText = "By Name (Z-A)";
            break;
        case 'byAmountLH':  // low to high price
            sortText = "By Amount (Low to High)";
            break;
        case 'byAmountHL':  // high to low price
            sortText = "By Amount (High to Low)";
            break;
        case 'byDateLM':  // least recent to most recent date
            sortText = "By Date (Least Recent to Most Recent)";
            break;
        case 'byDateML': // the default is byDateML, most recent to least recent
            sortText = "By Date (Most Recent to Least Recent)";
            break;
    }

    console.log(startDate)
    yPos += createMultipleTextOneLine(doc, `Start Date: ${startDate}`, `End Date: ${endDate}`, "", yPos)
    yPos += createMultipleTextOneLine(doc, `Low Price: ${lowPrice}`, `High Price: ${highPrice}`, "", yPos)
    yPos += createMultipleTextOneLine(doc, `Transaction Sort: ${sortText}`, "", "", yPos)

    // Fetch transaction data
    const transactions = getAllVisibleTransactions();

    yPos += 20
    const currentBalance = document.getElementById("current-balance").textContent;
    doc.setFont("times", "bold")
    createSingleText(doc, `Current Balance: $${currentBalance}`, 20, yPos)
    doc.setFont("times", "normal")

    yPos += 10
    // Add transactions to the PDF
    doc.setFontSize(12);
    const tableHeader = ["Category", "Date", "Name", "Amount"];
    
    // Draw table header with borders
    const columnWidths = [40, 30, 60, 30]; // Widths of each column
    const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0); // 160 - sum of columnwidths

    createSingleText(doc, "Incomes", 20, yPos)
    doc.setFontSize(12)
    let currentXPos = (pageWidth - tableWidth) / 2 + 5; // Center the table
    // Draw the header row with column labels
    doc.setFont("times", "bold");
    // doc.line((pageWidth - tableWidth) / 2, yPos + 2, (pageWidth + tableWidth) / 2, yPos + 2);
    yPos += 10;
    tableHeader.forEach((header, colIndex) => {
        doc.text(header, currentXPos, yPos);
        currentXPos += columnWidths[colIndex];
    });
    doc.setFont("times", "normal"); // Revert to normal font for data
    
    // Draw horizontal line below the header
    doc.rect((pageWidth - tableWidth) / 2, yPos - 5, tableWidth, 8);
    yPos += 8
    
    let incomeTransactions = [];
    let expenseTransactions = []

    transactions.forEach((transaction) => {
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        if (transactionType === "income_source"){
            incomeTransactions.push(transaction)
        } else {
            expenseTransactions.push(transaction)
        }

    });

    incomeTransactions.forEach(transaction => {
        addTransactionToTable(transaction)
    });

    yPos += 10

    createSingleText(doc, "Expenses", 20, yPos)
    doc.setFontSize(12)

    currentXPos = (pageWidth - tableWidth) / 2 + 5; // Center the table
    // Draw the header row with column labels
    doc.setFont("times", "bold");
    // doc.line((pageWidth - tableWidth) / 2, yPos + 2, (pageWidth + tableWidth) / 2, yPos + 2);
    yPos += 10;
    tableHeader.forEach((header, colIndex) => {
        doc.text(header, currentXPos, yPos);
        currentXPos += columnWidths[colIndex];
    });
    doc.setFont("times", "normal"); // Revert to normal font for data
    
    // Draw horizontal line below the header
    doc.rect((pageWidth - tableWidth) / 2, yPos - 5, tableWidth, 8);
    yPos += 8

    expenseTransactions.forEach(transaction => {
        addTransactionToTable(transaction)
    });


    function addTransactionToTable(transaction) {
      //  const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        var transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();
        const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
        var transactionName = transaction.querySelector('td:nth-child(4)').textContent.trim();
        const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();
    
        var transactionName = transactionName.length > 30 ? transactionName.substring(0, 30) + '...' : transactionName;
        var transactionCategory = transactionCategory.length > 15 ? transactionCategory.substring(0, 15) + '...' : transactionCategory;

       // let formattedTransactionType = transactionType === "income_source" ? "Income" : "Expense";
    
        // Draw each row
       // doc.text(formattedTransactionType, currentXPos, yPos);
       currentXPos = (pageWidth - tableWidth) / 2 + 5;
       doc.text(transactionCategory, currentXPos, yPos);
        currentXPos += columnWidths[0];
        doc.text(transactionDate, currentXPos, yPos);
        currentXPos += columnWidths[1];
        doc.text(transactionName, currentXPos, yPos);
        currentXPos += columnWidths[2];
        doc.text(transactionAmount, currentXPos, yPos);
    
        // Add border for the current row
        doc.rect((pageWidth - tableWidth) / 2, yPos - 5, tableWidth, 10);
    
        yPos += 10; // Add space for the next row
        if (yPos + marginBottom > pageHeight) {
            doc.addPage(); // Add a new page
            yPos = 30; // Reset to the top of the new page
        }
    }
    
    // Add border around the entire table
   // doc.rect((pageWidth - tableWidth) / 2, 180 - 5, tableWidth, yPos - 180 + 5);
    

    // Save the PDF
    doc.save("summaries.pdf");
}


function createHeader(doc){
    let yPos = 20;
    var name = "Prasad Saha"; // temporary

    // Add titles
    createSingleText(doc, "Financial Report", 20, yPos);
    yPos += 10;  // Adjust yPos for the next title
    createSingleText(doc, name, 15, yPos);
    yPos += 10;
    createSingleText(doc, "Made with ", 15, yPos, "MyFinance", "https://myfinancewebste-deployed.vercel.app/");
    yPos += 10;

    // Add additional content
    createSingleText(doc, "MyFinance gives you the ability to customize Financial Reports.", 12, yPos);
    yPos += 5;
    createSingleText(doc, "Below are the filters used to make this report", 12, yPos);
    yPos += 10;
}

function createMultipleTextOneLine(doc, text1, text2, text3, yPos, bold2 = false, bold3 = false){
    const pageWidth = doc.internal.pageSize.getWidth();

    const TABLEX = 30;
    const MARGIN = 5;
    const XINC3TEXT = 50;
    const XINC2TEXT = 70;
    

    // Create a border around the text
    const totalWidth = 150; // Adding space between texts and margins
    const borderHeight = 8; // Height for the border (adjust as needed)
    var yPosChange = 8;

    // Draw the border (rectangle). We subtract 5 from the yPos to make sure the text is nice in the border


    if (text3) {
        doc.rect((pageWidth - totalWidth) / 2, yPos - 5, totalWidth, borderHeight);
        doc.text(text1, MARGIN + TABLEX, yPos);    
        if (bold2){
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }
        doc.text(text2, MARGIN + TABLEX + XINC3TEXT, yPos);  // "Raw Transactions"
        
        if (bold3){
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }

        doc.text(text3, MARGIN + TABLEX + XINC3TEXT * 2, yPos);    // "Summaries"
        doc.setFont("times", "normal")
    } else {
        const lines1 = text1.split('|').map(line => line.trim());
        const lines2 = text2.split('|').map(line => line.trim());
    
        var yPosChange = Math.max(lines1.length * 8, lines2.length * borderHeight)
    
        doc.rect((pageWidth - totalWidth) / 2, yPos - 5, totalWidth, yPosChange);
    
    
        // Display each line on a new line
        lines1.forEach((line, index) => {
            var indent = 0
            if (index >= 1 && line !== "None"){
                line = `${index}. ${line}`
                indent = 5
            }
            doc.text(line, TABLEX + MARGIN + indent, yPos + (index * 8));
        });
    
        lines2.forEach((line, index) => {
            var indent = 0
            if (index >= 1 && line !== "None"){
                line = `${index}. ${line}`
                indent = 5
            }
            doc.text(line, TABLEX + MARGIN + XINC2TEXT + indent, yPos + (index * 8));
        });
    }
    return yPosChange
}

function createSingleText(doc, text, fontSize, yPos, underlinedPart = "", url = "none") {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(fontSize);

    // Split the text into regular and underlined parts
    const regularText = underlinedPart ? text.split(underlinedPart)[0] : text;
    const underlinedText = underlinedPart ? underlinedPart : "";

    // Calculate the width of the regular and underlined parts
    const regularTextWidth = doc.getTextWidth(regularText);
    const underlinedTextWidth = doc.getTextWidth(underlinedText);

    // Place the regular text
    doc.text(regularText, (pageWidth - regularTextWidth - underlinedTextWidth) / 2, yPos);

    if (underlinedText) {
        // Place the underlined part
        doc.text(underlinedText, (pageWidth - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth, yPos);

        // Underline the text
        doc.line(
            (pageWidth - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth,
            yPos + 1, // Slightly below the text for the underline
            (pageWidth - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth + underlinedTextWidth,
            yPos + 1
        );

        // Add a clickable link to the underlined part
        if (url !== "none") {
            doc.link(
                (pageWidth - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth,
                yPos - fontSize,
                underlinedTextWidth,
                fontSize,
                { url: url }
            );
        }
    } else if (url !== "none") {
        // If there's no underlined part, handle the regular clickable text
        const textWidth = doc.getTextWidth(regularText);
        const xPosition = (pageWidth - textWidth) / 2;
        doc.link(xPosition, yPos - fontSize, textWidth, fontSize, { url: url });
    }
}
