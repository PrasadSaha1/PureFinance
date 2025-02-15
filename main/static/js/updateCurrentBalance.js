function updateCurrentBalance() {
  const balanceElement = document.getElementById("current-balance");

    let transactions = getAllTransactions(); // get the  transactions, new and old
    let newBalance = 0;

    transactions.forEach(row => {
        if (row.style.display != "none"){  // if the transaction is visible. Only include the visible ones
            const amountText = row.querySelector('td:nth-child(5)').textContent.trim();  // select the 5th <td> (Amount cell)
            const transactionType = row.querySelector('td:nth-child(1)').textContent.trim();  

            // trim the balances and add or subtract them as needed
            if (transactionType === "income_source") {
                newBalance += parseFloat(amountText.replace('$', '').replace(/,/g, '').trim());
            } else {
                newBalance -= parseFloat(amountText.replace('$', '').replace(/,/g, '').trim());
            }

            }
        });

    balanceElement.innerHTML = formatMoney(newBalance);  // update balance display

    // it will fade in to start
    const animationObserver = new MutationObserver(() => {
        // reapply the fadeIn animation
        balanceElement.style.animation = 'none'; // reset animation
        balanceElement.offsetHeight; // trigger reflow to restart the animation
        balanceElement.style.animation = 'fadeIn 3s'; // reapply animation
    });

    // configure the observer to watch for changes in text content
    animationObserver.observe(balanceElement, {
        characterData: true,
        childList: true,
        subtree: true,
    });
}
