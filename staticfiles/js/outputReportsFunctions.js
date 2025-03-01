document.addEventListener('DOMContentLoaded', function() {
    const exportToPDFBtn = document.getElementById('export-to-pdf');
    exportToPDFBtn.addEventListener('click', createGeneralPDF)
});

function createGeneralPDF() {
    // this will happen whether it's a summaries or transactions PDF

    // have an input in the modal
    showConfirmationModal("Please enter your name: ", true).then((userName) => {
        if (userName) {   // if they don't cancel
            const { jsPDF } = window.jspdf;  // make the PDF with jspdf
            const doc = new jsPDF();
            doc.setFont("times") // times new roman

            // see if they were viewing transactions or summaries
            const toggleViewAll = document.getElementById("toggle-view-all")
            if (toggleViewAll.classList.contains("btn-primary")) {
                var reportType = "rawTransactions"
            } else {
                var reportType = "summaries"
            } 

            createHeader(doc, userName);
            doc.setFontSize(12);

            // defining constants
            const PAGEWIDTH = doc.internal.pageSize.getWidth();
            const PAGEHEIGHT = doc.internal.pageSize.getHeight();
            const MARGINBOTTOM = 20;

            // createReportInformation shows all the info before the tables with the transactions/summaries
            var yPos = createReportInformation(doc, reportType)

            if (reportType === "rawTransactions"){
                makeTransactionsTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM);
            } else {
                makeSummariesTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM);
            }
        } 
});
}

function makeTransactionsTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM){
    /* This makes the PDF for when the user has transactions selected, rather than summaries*/
    // Fetch transaction data
    const transactions = getAllVisibleTransactions();
    
    yPos += 20

    // display the current Balance
    const currentBalance = document.getElementById("current-balance").textContent;
    doc.setFont("times", "bold")  // switch to bold
    createSingleText(doc, `Current Balance: $${currentBalance}`, 20, yPos)
    doc.setFont("times", "normal") // switch back to normal

    // if there's an intial balance, display it
    let includeInitialBalance = document.getElementById("include-initial-balance").checked;
    var initialBalance = document.getElementById("initialBalance").textContent;
    if (includeInitialBalance) {
        yPos += 10
        createSingleText(doc, `Initial Balance: ${initialBalance}`, 16, yPos)
    }

    yPos += 10
    doc.setFontSize(12);
    
    // draw table header with borders
    const columnWidths = [40, 30, 60, 30]; // widths of each column
    const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0); // 160 - sum of columnwidths

    let incomeTransactions = [];
    let expenseTransactions = []

    // add transactions to either income or expense transactions
    transactions.forEach((transaction) => {
        const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
        if (transactionType === "income_source"){
            incomeTransactions.push(transaction)
        } else {
            expenseTransactions.push(transaction)
        }
    });

    // display the incomes
    yPos = makeTableHeader(doc, "Incomes", yPos, PAGEWIDTH, tableWidth, columnWidths)
    incomeTransactions.forEach(transaction => {
        // addTransactionToTable returns the new yPos
        yPos = addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM)
    });

    yPos += 10

    // display the header
    yPos = makeTableHeader(doc, "Expenses", yPos, PAGEWIDTH, tableWidth, columnWidths)
    expenseTransactions.forEach(transaction => {
        // addTransactionToTable returns the new yPos
        yPos = addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM)
    });


    // save the PDF
    doc.save("transactions.pdf");
}

function makeSummariesTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM){
    const summaries = document.querySelectorAll('#summariesTable tbody tr'); // get all rows (tr) in tbody

    yPos += 20
    
    // draw table header with borders
    const columnWidths = [30, 30, 30]; // widths of each column
    const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0); // 160 - sum of columnwidths

    yPos = makeTableHeader(doc, "Summaries", yPos, PAGEWIDTH, tableWidth, columnWidths)
    summaries.forEach(summary => {
        yPos = addSummaryToTable(doc, summary, yPos, columnWidths, tableWidth, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM)
    });

    doc.save("summaries.pdf");
}

function addSummaryToTable(doc, summary, yPos, columnWidths, tableWidth, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM){
    const startDate = summary.querySelector('td:nth-child(1)').textContent.trim();  // get the info about the summary
    const endDate = summary.querySelector('td:nth-child(2)').textContent.trim();
    const summaryAmount = summary.querySelector('td:nth-child(3)').textContent.trim();

    currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5;  // make the table centered
    doc.text(startDate, currentXPos, yPos);
    currentXPos += columnWidths[0];  // add to the xPos
    doc.text(endDate, currentXPos, yPos);
    currentXPos += columnWidths[1];
    doc.text(summaryAmount, currentXPos, yPos);

    // add border for the current row
    doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 10);

    yPos += 10; // add space for the next row
    if (yPos + MARGINBOTTOM > PAGEHEIGHT) {  // if it extends beyond the page
        doc.addPage(); // add a new page
        yPos = 30; // reset to the top of the new page
    }
    return yPos  // make it easier to change the yPos
}

function makeTableHeader(doc, type, yPos, PAGEWIDTH, tableWidth, columnWidths){
    if (type === "Summaries") {  // based on the type of PDF
        var tableHeader = ["Start Date", "End Date", "Amount"];
    } else {
        var tableHeader = ["Category", "Date", "Name", "Amount"];
    }

    createSingleText(doc, type, 20, yPos)
    doc.setFontSize(12)
    let currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5; // center the table
    doc.setFont("times", "bold");

    yPos += 10;
    tableHeader.forEach((header, colIndex) => {
        doc.text(header, currentXPos, yPos);
        currentXPos += columnWidths[colIndex];
    });
    doc.setFont("times", "normal"); // revert to normal font for data
    
    // draw horizontal line below the header
    doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 8);
    yPos += 8

    return yPos

}

function addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM) {
      var transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();
      const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
      var transactionName = transaction.querySelector('td:nth-child(4)').textContent.trim();
      const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();
  
      // limit the name and category after some time to avoid it form overflowing
      var transactionName = transactionName.length > 30 ? transactionName.substring(0, 30) + '...' : transactionName;
      var transactionCategory = transactionCategory.length > 18 ? transactionCategory.substring(0, 15) + '...' : transactionCategory;
  
      // draw each row
     currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5;
     doc.text(transactionCategory, currentXPos, yPos);
      currentXPos += columnWidths[0];
      doc.text(transactionDate, currentXPos, yPos);
      currentXPos += columnWidths[1];
      doc.text(transactionName, currentXPos, yPos);
      currentXPos += columnWidths[2];
      doc.text(transactionAmount, currentXPos, yPos);
  
      // add border for the current row
      doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 10);
  
      yPos += 10; // add space for the next row
      if (yPos + MARGINBOTTOM > PAGEHEIGHT) {
          doc.addPage(); // add a new page
          yPos = 30; // reset to the top of the new page
      }
      return yPos
  }

function createHeader(doc, userName) {
    /* Creates the top information, before the filtering info */
    let yPos = 20;
    var name = userName;

    //  image at the top left
    doc.addImage('/static/images/pureFinanceLogo.png', 'PNG', 10, 10, 30, 30); 

    // add titles
    createSingleText(doc, "Financial Report", 20, yPos);
    yPos += 10;  
    createSingleText(doc, name, 15, yPos);
    yPos += 10;
    // extra information to handle the link
    createSingleText(doc, "Made with ", 15, yPos, underlinedPart = "PureFinance", url = "https://purefinance.vercel.app/");
    yPos += 10;
    createSingleText(doc, "PureFinance gives you the ability to customize Financial Reports.", 12, yPos);
    yPos += 5;  // smaller font, smaller change
    createSingleText(doc, "Below are the filters used to make this report", 12, yPos);
    yPos += 10;
}

function createMultipleTextOneLine(doc, text1, text2, text3, yPos, bold2 = false, bold3 = false){
    // texts at multiple x positions
    
    const PAGEWIDTH = doc.internal.pageSize.getWidth();

    // constants
    const TABLEX = 30;
    const MARGIN = 5;
    const XINC3TEXT = 50;
    const XINC2TEXT = 70;
    

    // create a border around the text
    const totalWidth = 150; // adding space between texts and margins
    const borderHeight = 8; // height of each section
    var yPosChange = 8;


    if (text3) {  // if there's a third text

        // draw a rectangle around the text
        doc.rect((PAGEWIDTH - totalWidth) / 2, yPos - 5, totalWidth, borderHeight);

        doc.text(text1, MARGIN + TABLEX, yPos); 
        if (bold2){ // determine if it should be bolded
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }
        doc.text(text2, MARGIN + TABLEX + XINC3TEXT, yPos); 
        
        if (bold3){
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }

        doc.text(text3, MARGIN + TABLEX + XINC3TEXT * 2, yPos); 
        doc.setFont("times", "normal")
    } else {

        // if neccesary, split the text with the | symbol
        const lines1 = text1.split('|').map(line => line.trim());
        const lines2 = text2.split('|').map(line => line.trim());
    
        // change in yPos to be returned
        yPosChange = Math.max(lines1.length * 8, lines2.length * borderHeight)
    
        doc.rect((PAGEWIDTH - totalWidth) / 2, yPos - 5, totalWidth, yPosChange);
    
        // display each line on a new line
        lines1.forEach((line, index) => {
            var indent = 0  // indent each item of the list
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
    return yPosChange  // change in yPos
}

function createSingleText(doc, text, fontSize, yPos, underlinedPart = "", url = "none", indent = false) {
    const PAGEWIDTH = doc.internal.pageSize.getWidth();
    doc.setFontSize(fontSize);

    // split the text into regular and underlined parts if needed
    const regularText = underlinedPart ? text.split(underlinedPart)[0] : text;
    const underlinedText = underlinedPart ? underlinedPart : "";

    // calculate the width of the regular and underlined parts
    const regularTextWidth = doc.getTextWidth(regularText);
    const underlinedTextWidth = doc.getTextWidth(underlinedText);

    var indentSize = indent ? 5 : 0;  // see if an indent is needed

    // place the regular text
    doc.text(regularText, (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + indentSize, yPos);

    if (underlinedText) {
        // place the underlined part
        doc.text(underlinedText, (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth, yPos);

        // underline the text
        doc.line(
            (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth,
            yPos + 1, // slightly below the text for the underline
            (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth + underlinedTextWidth,
            yPos + 1
        );

        // add a clickable link to the underlined part
        doc.link(
            (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth,
            yPos - fontSize,
            underlinedTextWidth,
            fontSize,
            { url: url }
        );
    } 
}

function createReportInformation(doc, reportType) {
    /* Info about the filtering for the report */
    if (reportType === "rawTransactions"){
        var rawTransactions = true; 
    } else {
        var rawTransactions = false;
    }

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
 
    // show the type of report amd transaction types included
    let yPos = 70;
    yPos += createMultipleTextOneLine(doc, "Report Type:", "Raw Transactions", "Summaries", yPos, rawTransactions, !rawTransactions)
    yPos += createMultipleTextOneLine(doc, "Transaction Types Included:", "Incomes", "Expenses", yPos, includeIncome, includeExpense)
    
    if (rawTransactions) {  // if it includes the initial balance
        yPos += createMultipleTextOneLine(doc, "Includes Initial Balance:", "Yes", "No", yPos, includeInitialBalance, !includeInitialBalance)
    } else {
        // displays info about the summary
        var summarySize, referenceDate;

        const selectedValue = document.querySelector('input[name="summaryType"]:checked').value;
        if (selectedValue === "custom"){
            const numberValue = document.getElementById("custom-value").value;
            const unitValue = document.getElementById("custom-unit").value;
            const dateValue = document.getElementById("custom-date").value

            summarySize = `${numberValue} ${unitValue}`
            referenceDate = formatDate(dateValue);
        } else {
            summarySize = selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)  // capitlize the first character of a string. Ex. - variable name "weekly" to Weekly
        }
        
        // reference date is only needed for custom
        if (referenceDate){
            yPos += createMultipleTextOneLine(doc, `Summary Size: ${summarySize}`, `Reference Date: ${referenceDate}`, "", yPos)
        } else {
            yPos += createMultipleTextOneLine(doc, `Summary Size: ${summarySize}`, "", "", yPos)
        }
    }
 
     var startDate = "All Dates"
     var endDate = "All Dates"  // if there's no filtering, keep them like this
     const dateToggle = document.getElementById('date-filter-checkbox');

     // note that in the process of making the start date and end date for filtering, no transactions will be seen, 
     // and the export to PDF button will be hidden, so nothing will be undefined
     if (dateToggle.checked) {
         startDate = document.getElementById('start-date').value;  // get the start and end dates
         endDate = document.getElementById('end-date').value;
         startDate = formatDate(startDate);
         endDate = formatDate(endDate)
     }    
 
     var lowPrice = "All Prices";  // if there's no filtering, keep them like this
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

     // an if statement is used rather than a switch due to different behavior based on the report type
     if (sortOption === 'byNameAZ' && reportType !== "summaries") {  
        sortText = "By Name (A-Z)";  
    } else if (sortOption === 'byNameZA' && reportType !== "summaries") {  
        sortText = "By Name (Z-A)";  
    } else if (sortOption === 'byAmountLH') {  
        sortText = "By Amount (Low to High)";  
    } else if (sortOption === 'byAmountHL') {  
        sortText = "By Amount (High to Low)";  
    } else if (sortOption === 'byDateLM') {  
        sortText = "By Date (Least Recent to Most Recent)";  
    } else {  // Default: byDateML  
        sortText = "By Date (Most Recent to Least Recent)";  
    }
    
    // display all of the filtering and sorting
     yPos += createMultipleTextOneLine(doc, `Start Date: ${startDate}`, `End Date: ${endDate}`, "", yPos)
     yPos += createMultipleTextOneLine(doc, `Low Price: ${lowPrice}`, `High Price: ${highPrice}`, "", yPos)
     yPos += createMultipleTextOneLine(doc, `Sort: ${sortText}`, "", "", yPos)

     // determine which categories are on screen
     const categoryCheckboxes = getAllCategoryCheckboxes()

     var incomeCheckedCategories = [];
     var incomeUncheckedCategories = [];
     var expenseCheckedCategories = [];
     var expenseUncheckedCategories = []
  
     categoryCheckboxes.forEach(checkbox => {
      var checkboxValueSplit = checkbox.value.split("-")  // split between the name and transaction type (income_source/expense)
      if (checkboxValueSplit[0] !== "No Category") {  // don't include no category
          if (checkbox.checked){  // put in the checked categories
              if (checkboxValueSplit[1] === "income_source"){  // determine where to put it
                  incomeCheckedCategories.push(checkboxValueSplit[0])
              } else {
                  expenseCheckedCategories.push(checkboxValueSplit[0])
              }
          } else {  // put in the expense categories
              if (checkboxValueSplit[1] === "income_source"){
                  incomeUncheckedCategories.push(checkboxValueSplit[0])
              } else {
                  expenseUncheckedCategories.push(checkboxValueSplit[0])
              }
          }
      }
      });
  
     // we are using the | to split each category. Users can not enter speical characters, so there shouldn't be any conflicts
     var formattedCheckedIncomeCategories = incomeCheckedCategories.join("| ") || "None";
     var formattedUncheckedIncomeCategories = incomeUncheckedCategories.join("| ") || "None";
     var formattedCheckedExpenseCategories = expenseCheckedCategories.join("| ") || "None";
     var formattedUncheckedExpenseCategories = expenseUncheckedCategories.join(" ") || "None";
  
      yPos += createMultipleTextOneLine(doc, `Income Categories Included: |${formattedCheckedIncomeCategories}`, `Expense Categories Included: |${formattedCheckedExpenseCategories}`, "", yPos)
      yPos += createMultipleTextOneLine(doc, `Income Categories Excluded: |${formattedUncheckedIncomeCategories}`, `Expense Categories Excluded: |${formattedUncheckedExpenseCategories}`, "", yPos)

     return yPos;
}
