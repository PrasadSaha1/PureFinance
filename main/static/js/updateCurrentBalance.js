function getAllTransactions() {
  // Select all transactions initially
  let transactions = Array.from(document.querySelectorAll('[id^="transaction-id-"]'));
  
  // Create a MutationObserver to observe changes in the DOM for new transactions
  const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.id && node.id.startsWith("transaction-id-")) {
                  // When a new transaction is added, push it to the transactions array
                  transactions.push(node);
              }
          });
      });
  });

  // Start observing for added nodes in the entire body
  observer.observe(document.body, {
      childList: true,
      subtree: true
  });

  return transactions;
}

function updateCurrentBalance() {
  const balanceElement = document.getElementById("current-balance");

  // Function to recalculate the balance based on the transactions
 // const calculateBalance = () => {
      let transactions = getAllTransactions(); // Get the latest transactions
      let newBalance = 0;

      transactions.forEach(row => {
          if (row.style.display != "none"){
            const amountText = row.querySelector('td:nth-child(5)').textContent.trim();  // Select the 5th <td> (Amount cell)
            const transactionType = row.querySelector('td:nth-child(1)').textContent.trim();


            // Adjust balance based on transaction type
            if (transactionType === "income_source") {
                newBalance += parseFloat(amountText.replace('$', '').replace(/,/g, '').trim());
            } else {
                newBalance -= parseFloat(amountText.replace('$', '').replace(/,/g, '').trim());
            }

          }
      });

      balanceElement.innerHTML = formatMoney(newBalance);  // Update balance display

      const animationObserver = new MutationObserver(() => {
          // Reapply the fadeIn animation
          balanceElement.style.animation = 'none'; // Reset animation
          balanceElement.offsetHeight; // Trigger reflow to restart the animation
          balanceElement.style.animation = 'fadeIn 3s'; // Reapply animation
      });

      // Configure the observer to watch for changes in text content
      animationObserver.observe(balanceElement, {
          characterData: true,
          childList: true,
          subtree: true,
      });
 // };

  // Initial balance calculation
  // calculateBalance();
}
