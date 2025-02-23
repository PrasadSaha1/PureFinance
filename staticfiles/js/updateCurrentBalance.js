function updateCurrentBalance() {
    const balanceElement = document.getElementById("current-balance");
    const oldBalance = parseFloat(balanceElement.textContent.replace('$', '').replace(/,/g, '').trim());

    let transactions = getAllTransactions(); // get the transactions, new and old
    let newBalance = 0;

    transactions.forEach(row => {
        if (row.style.display !== "none") {  // if the transaction is visible. Only include the visible ones
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

    const includeInitialBalanceCheckbox = document.getElementById("include-initial-balance")
    if (includeInitialBalanceCheckbox.checked){
        var initialBalance = document.getElementById("initialBalance").textContent;
        newBalance += parseFloat(initialBalance.replace('$', '').replace(/,/g, '').trim());

       const initialBalanceDisplayInTransactions = document.getElementById("initialBalanceDisplayInTransactions")
       initialBalanceDisplayInTransactions.textContent = `The Initial Balance was ${initialBalance}.`
    }

    // Only update and animate if the balance has changed
    if (oldBalance !== newBalance) {
        balanceElement.innerHTML = formatMoney(newBalance);  // update balance display

        // Create the animation observer and reset animation only if balance has changed
        const animationObserver = new MutationObserver(() => {
            // reapply the fadeIn animation
            balanceElement.style.animation = 'none'; // reset animation
            balanceElement.offsetHeight; // trigger reflow to restart the animation
            balanceElement.style.animation = 'fadeIn 3s'; // reapply animation

            // Disconnect the observer after it runs once
            animationObserver.disconnect();
        });

        // configure the observer to watch for changes in text content
        animationObserver.observe(balanceElement, {
            characterData: true,
            childList: true,
            subtree: true,
        });
    } 
}
