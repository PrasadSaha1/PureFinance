document.addEventListener('DOMContentLoaded', function() {
    const exportToPDFBtn = document.getElementById('export-to-pdf');
    exportToPDFBtn.addEventListener('click', createGeneralPDF)
});

function createGeneralPDF() {
    showConfirmationModal("Please enter your name: ", true).then((userName) => {
        if (userName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFont("times") // times new roman


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

        var yPos = createReportInformation(doc, reportType)

        if (reportType === "rawTransactions"){
            makeTransactionsTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM);
        } else {
            makeSummariesTable(doc, yPos, PAGEWIDTH, PAGEHEIGHT, MARGINBOTTOM);
        }
    } 
});
}

function makeTransactionsTable(doc, yPos, PAGEWIDTH, pageHeight, marginBottom){
    /* This makes the PDF for when the user has transactions selected, rather than summaries*/
    // Fetch transaction data
    const transactions = getAllVisibleTransactions();
    
    yPos += 20
    const currentBalance = document.getElementById("current-balance").textContent;
    doc.setFont("times", "bold")
    createSingleText(doc, `Current Balance: $${currentBalance}`, 20, yPos)
    doc.setFont("times", "normal")

    let includeInitialBalance = document.getElementById("include-initial-balance").checked;
    var initialBalance = document.getElementById("initialBalance").textContent;
    if (includeInitialBalance) {
        yPos += 10
        createSingleText(doc, `Initial Balance: ${initialBalance}`, 16, yPos)
    }

    yPos += 10
    // Add transactions to the PDF
    doc.setFontSize(12);
    
    // Draw table header with borders
    const columnWidths = [40, 30, 60, 30]; // Widths of each column
    const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0); // 160 - sum of columnwidths

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


    yPos = makeTableHeader(doc, "Incomes", yPos, PAGEWIDTH, tableWidth, columnWidths)
    incomeTransactions.forEach(transaction => {
        yPos = addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, pageHeight, marginBottom)
    });

    yPos += 10
    yPos = makeTableHeader(doc, "Expenses", yPos, PAGEWIDTH, tableWidth, columnWidths)
    expenseTransactions.forEach(transaction => {
        yPos = addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, pageHeight, marginBottom)
    });


    // Save the PDF
    doc.save("transactions.pdf");
}

function makeSummariesTable(doc, yPos, PAGEWIDTH, pageHeight, marginBottom){
     
    const summaries = document.querySelectorAll('#summariesTable tbody tr'); // Get all rows (tr) in tbody

    yPos += 20
    
    // Draw table header with borders
    const columnWidths = [30, 30, 30]; // Widths of each column
    const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0); // 160 - sum of columnwidths

    yPos = makeTableHeader(doc, "Summaries", yPos, PAGEWIDTH, tableWidth, columnWidths)
    summaries.forEach(summary => {
        yPos = addSummaryToTable(doc, summary, yPos, columnWidths, tableWidth, PAGEWIDTH, pageHeight, marginBottom)
    });

    doc.save("summaries.pdf");
}

function addSummaryToTable(doc, summary, yPos, columnWidths, tableWidth, PAGEWIDTH, pageHeight, marginBottom){
    const startDate = summary.querySelector('td:nth-child(1)').textContent.trim();
    const endDate = summary.querySelector('td:nth-child(2)').textContent.trim();
    const summaryAmount = summary.querySelector('td:nth-child(3)').textContent.trim();


    currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5;
    doc.text(startDate, currentXPos, yPos);
     currentXPos += columnWidths[0];
     doc.text(endDate, currentXPos, yPos);
     currentXPos += columnWidths[1];
     doc.text(summaryAmount, currentXPos, yPos);
 
     // Add border for the current row
     doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 10);
 
     yPos += 10; // Add space for the next row
     if (yPos + marginBottom > pageHeight) {
         doc.addPage(); // Add a new page
         yPos = 30; // Reset to the top of the new page
     }
     return yPos

}

function makeTableHeader(doc, type, yPos, PAGEWIDTH, tableWidth, columnWidths){
    if (type === "Summaries") {
        var tableHeader = ["Start Date", "End Date", "Amount"];
    } else {
        var tableHeader = ["Category", "Date", "Name", "Amount"];
    }

    createSingleText(doc, type, 20, yPos)
    doc.setFontSize(12)
    let currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5; // Center the table
    doc.setFont("times", "bold");

    yPos += 10;
    tableHeader.forEach((header, colIndex) => {
        doc.text(header, currentXPos, yPos);
        currentXPos += columnWidths[colIndex];
    });
    doc.setFont("times", "normal"); // Revert to normal font for data
    
    // Draw horizontal line below the header
    doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 8);
    yPos += 8

    return yPos

}

function addTransactionToTable(doc, transaction, yPos, columnWidths, tableWidth, PAGEWIDTH, pageHeight, marginBottom) {
    //  const transactionType = transaction.querySelector('td:nth-child(1)').textContent.trim();
      var transactionCategory = transaction.querySelector('td:nth-child(2) .view-mode').textContent.trim();
      const transactionDate = transaction.querySelector('td:nth-child(3)').textContent.trim();
      var transactionName = transaction.querySelector('td:nth-child(4)').textContent.trim();
      const transactionAmount = transaction.querySelector('td:nth-child(5)').textContent.trim();
  
      var transactionName = transactionName.length > 30 ? transactionName.substring(0, 30) + '...' : transactionName;
      var transactionCategory = transactionCategory.length > 18 ? transactionCategory.substring(0, 15) + '...' : transactionCategory;

     // let formattedTransactionType = transactionType === "income_source" ? "Income" : "Expense";
  
      // Draw each row
     // doc.text(formattedTransactionType, currentXPos, yPos);
     currentXPos = (PAGEWIDTH - tableWidth) / 2 + 5;
     doc.text(transactionCategory, currentXPos, yPos);
      currentXPos += columnWidths[0];
      doc.text(transactionDate, currentXPos, yPos);
      currentXPos += columnWidths[1];
      doc.text(transactionName, currentXPos, yPos);
      currentXPos += columnWidths[2];
      doc.text(transactionAmount, currentXPos, yPos);
  
      // Add border for the current row
      doc.rect((PAGEWIDTH - tableWidth) / 2, yPos - 5, tableWidth, 10);
  
      yPos += 10; // Add space for the next row
      if (yPos + marginBottom > pageHeight) {
          doc.addPage(); // Add a new page
          yPos = 30; // Reset to the top of the new page
      }
      return yPos
  }

  function createHeader(doc, userName) {
    let yPos = 20;
    var name = userName; // temporary

    // Add the image at the top left
    doc.addImage('/static/images/pureFinanceLogo.png', 'PNG', 10, 10, 30, 30); // Path to your static image

    // Add titles
    createSingleText(doc, "Financial Report", 20, yPos);
    yPos += 10;  // Adjust yPos for the next title
    createSingleText(doc, name, 15, yPos);
    yPos += 10;
    createSingleText(doc, "Made with ", 15, yPos, underlinedPart = "PureFinance", url = "https://purefinance.vercel.app/");
    yPos += 10;

    // Add additional content
    createSingleText(doc, "PureFinance gives you the ability to customize Financial Reports.", 12, yPos);
    yPos += 5;
    createSingleText(doc, "Below are the filters used to make this report", 12, yPos);
    yPos += 10;
}


function createMultipleTextOneLine(doc, text1, text2, text3, yPos, bold2 = false, bold3 = false){
    const PAGEWIDTH = doc.internal.pageSize.getWidth();

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
        doc.rect((PAGEWIDTH - totalWidth) / 2, yPos - 5, totalWidth, borderHeight);
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
    
        doc.rect((PAGEWIDTH - totalWidth) / 2, yPos - 5, totalWidth, yPosChange);
    
    
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

function createSingleText(doc, text, fontSize, yPos, underlinedPart = "", url = "none", indent = false) {
    const PAGEWIDTH = doc.internal.pageSize.getWidth();
    doc.setFontSize(fontSize);

    // Split the text into regular and underlined parts
    const regularText = underlinedPart ? text.split(underlinedPart)[0] : text;
    const underlinedText = underlinedPart ? underlinedPart : "";

    // Calculate the width of the regular and underlined parts
    const regularTextWidth = doc.getTextWidth(regularText);
    const underlinedTextWidth = doc.getTextWidth(underlinedText);

    var indentSize = indent ? 5 : 0;

    // Place the regular text
    doc.text(regularText, (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + indentSize, yPos);

    if (underlinedText) {
        // Place the underlined part
        doc.text(underlinedText, (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth, yPos);

        // Underline the text
        doc.line(
            (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth,
            yPos + 1, // Slightly below the text for the underline
            (PAGEWIDTH - regularTextWidth - underlinedTextWidth) / 2 + regularTextWidth + underlinedTextWidth,
            yPos + 1
        );

        // Add a clickable link to the underlined part
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
 
    let yPos = 70;
    yPos += createMultipleTextOneLine(doc, "Report Type:", "Raw Transactions", "Summaries", yPos, rawTransactions, !rawTransactions)
    yPos += createMultipleTextOneLine(doc, "Transaction Types Included:", "Incomes", "Expenses", yPos, includeIncome, includeExpense)
    
    if (rawTransactions) {
        yPos += createMultipleTextOneLine(doc, "Includes Initial Balance:", "Yes", "No", yPos, includeInitialBalance, !includeInitialBalance)
    } else {
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
        
        if (referenceDate){
            yPos += createMultipleTextOneLine(doc, `Summary Size: ${summarySize}`, `Reference Date: ${referenceDate}`, "", yPos)
        } else {
        yPos += createMultipleTextOneLine(doc, `Summary Size: ${summarySize}`, "", "", yPos)
        }
    }
 
     var startDate = "All Dates"
     var endDate = "All Dates"
     const dateToggle = document.getElementById('date-filter-checkbox');
     if (dateToggle.checked) {
         startDate = document.getElementById('start-date').value;  // get the start and end dates
         endDate = document.getElementById('end-date').value;
         startDate = formatDate(startDate);
         endDate = formatDate(endDate)
     }    
 
  //   const pageHeight = doc.internal.pageSize.getHeight();
   //  const marginBottom = 20;
 
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
    
     yPos += createMultipleTextOneLine(doc, `Start Date: ${startDate}`, `End Date: ${endDate}`, "", yPos)
     yPos += createMultipleTextOneLine(doc, `Low Price: ${lowPrice}`, `High Price: ${highPrice}`, "", yPos)
     yPos += createMultipleTextOneLine(doc, `Sort: ${sortText}`, "", "", yPos)

     const categoryCheckboxes = getAllCategoryCheckboxes()

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
  
     // we are using the | to split each category. Users can not enter speical characters, so there shouldn't be any conflicts
     var formattedCheckedIncomeCategories = incomeCheckedCategories.join("| ") || "None";
     var formattedUncheckedIncomeCategories = incomeUncheckedCategories.join("| ") || "None";
     var formattedCheckedExpenseCategories = expenseCheckedCategories.join("| ") || "None";
     var formattedUncheckedExpenseCategories = expenseUncheckedCategories.join(" ") || "None";
  
      yPos += createMultipleTextOneLine(doc, `Income Categories Included: |${formattedCheckedIncomeCategories}`, `Expense Categories Included: |${formattedCheckedExpenseCategories}`, "", yPos)
  
      yPos += createMultipleTextOneLine(doc, `Income Categories Excluded: |${formattedUncheckedIncomeCategories}`, `Expense Categories Excluded: |${formattedUncheckedExpenseCategories}`, "", yPos)
  

     return yPos;
}
