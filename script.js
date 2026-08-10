import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

console.log("Firebase connected:", auth);

console.log("Firebase connected:", auth);
// ==========================================
// PROFILE
// ==========================================

let profile =
    localStorage.getItem("profile") || "student";


// ==========================================
// DATA
// ==========================================

let expenses =
    JSON.parse(
        localStorage.getItem("expenses")
    ) || [];

let incomes =
    JSON.parse(
        localStorage.getItem("incomes")
    ) || [];

let budgets =
    JSON.parse(
        localStorage.getItem("budgets")
    ) || {};

// ID of expense currently being edited

let editingExpenseId = null;


// ==========================================
// MIGRATE OLD DATA
// ==========================================

function migrateOldData() {

    let changed = false;


    Object.keys(incomes).forEach(function (key) {

        if (!key.includes("_")) {

            const newKey =
                "student_" + key;

            if (
                incomes[newKey] === undefined
            ) {

                incomes[newKey] =
                    incomes[key];

            }

            delete incomes[key];

            changed = true;

        }

    });


    expenses.forEach(function (expense) {

        if (!expense.profile) {

            expense.profile = "student";

            changed = true;

        }

    });


    if (changed) {

        localStorage.setItem(
            "incomes",
            JSON.stringify(incomes)
        );

        localStorage.setItem(
            "expenses",
            JSON.stringify(expenses)
        );

    }

}

migrateOldData();


// ==========================================
// CATEGORIES
// ==========================================

const studentCategories = [

    "Food",
    "Hostel / Rent",
    "Transport",
    "Education",
    "Shopping",
    "Entertainment",
    "Mobile / Internet",
    "Health",
    "Other"

];


const workerCategories = [

    "Food",
    "Rent",
    "Transport / Fuel",
    "Bills",
    "Shopping",
    "Entertainment",
    "Mobile / Internet",
    "EMI",
    "Health",
    "Investment",
    "Other"

];


// ==========================================
// PAGE LOAD
// ==========================================

window.onload = function () {

    const monthInput =
        document.getElementById(
            "selectedMonth"
        );


    const today = new Date();


    const currentMonth =
        today.getFullYear() +
        "-" +
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    monthInput.value =
        currentMonth;


    document.getElementById(
        "expenseDate"
    ).value =
        formatDate(today);


    updateProfileButtons();

    updateCategories();

    updateFilterCategories();

    updateDisplay();

};


// ==========================================
// DATE
// ==========================================

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// ==========================================
// SELECTED MONTH
// ==========================================

function getSelectedMonth() {

    return document.getElementById(
        "selectedMonth"
    ).value;

}


// ==========================================
// INCOME KEY
// ==========================================

function getIncomeKey() {

    return `${profile}_${getSelectedMonth()}`;

}


// ==========================================
// PROFILE
// ==========================================

function selectProfile(type) {

    profile = type;


    localStorage.setItem(
        "profile",
        profile
    );


    updateProfileButtons();

    updateCategories();

    updateFilterCategories();

    updateDisplay();

}


// ==========================================
// PROFILE BUTTONS
// ==========================================

function updateProfileButtons() {

    const studentBtn =
        document.getElementById(
            "studentBtn"
        );

    const workerBtn =
        document.getElementById(
            "workerBtn"
        );


    studentBtn.classList.remove(
        "active"
    );

    workerBtn.classList.remove(
        "active"
    );


    if (profile === "student") {

        studentBtn.classList.add(
            "active"
        );

    } else {

        workerBtn.classList.add(
            "active"
        );

    }

}


// ==========================================
// ADD CATEGORIES
// ==========================================

function updateCategories() {

    const select =
        document.getElementById(
            "expenseCategory"
        );


    select.innerHTML =
        `<option value="">
            Select Category
        </option>`;


    const categories =
        profile === "student"
            ? studentCategories
            : workerCategories;


    categories.forEach(function (category) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            category;

        option.textContent =
            category;


        select.appendChild(
            option
        );

    });

}


// ==========================================
// FILTER CATEGORIES
// ==========================================

function updateFilterCategories() {

    const filter =
        document.getElementById(
            "filterCategory"
        );


    const currentValue =
        filter.value;


    filter.innerHTML =
        `<option value="all">
            All Categories
        </option>`;


    const categories =
        profile === "student"
            ? studentCategories
            : workerCategories;


    categories.forEach(function (category) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            category;

        option.textContent =
            category;


        filter.appendChild(
            option
        );

    });


    if (
        categories.includes(
            currentValue
        )
    ) {

        filter.value =
            currentValue;

    }

}


// ==========================================
// SET INCOME
// ==========================================

function setIncome() {

    const input =
        document.getElementById(
            "income"
        );


    const value =
        Number(input.value);


    if (
        input.value === "" ||
        value < 0
    ) {

        alert(
            "Please enter a valid income."
        );

        return;

    }


    incomes[getIncomeKey()] =
        value;


    localStorage.setItem(
        "incomes",
        JSON.stringify(incomes)
    );


    input.value = "";


    updateDisplay();

}


// ==========================================
// GET INCOME
// ==========================================

function getMonthlyIncome() {

    return Number(
        incomes[getIncomeKey()] || 0
    );

}


// ==========================================
// ADD EXPENSE
// ==========================================

async function addExpense() {
    const name =
        document.getElementById(
            "expenseName"
        ).value.trim();


    const amount =
        Number(
            document.getElementById(
                "expenseAmount"
            ).value
        );


    const category =
        document.getElementById(
            "expenseCategory"
        ).value;


    const date =
        document.getElementById(
            "expenseDate"
        ).value;


    if (name === "") {

        alert(
            "Please enter the expense name."
        );

        return;

    }


    if (
        amount <= 0 ||
        document.getElementById(
            "expenseAmount"
        ).value === ""
    ) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    if (category === "") {

        alert(
            "Please select a category."
        );

        return;

    }


    if (date === "") {

        alert(
            "Please select a date."
        );

        return;

    }


    if (
        date.substring(0, 7) !==
        getSelectedMonth()
    ) {

        alert(
            "Expense date must belong to the selected month."
        );

        return;

    }


    const expense = {

        id: Date.now(),

        name: name,

        amount: amount,

        category: category,

        date: date,

        profile: profile

    };


expenses.push(expense);

await saveExpenses();

clearForm();

updateDisplay();

}


// ==========================================
// SAVE EXPENSES
// ==========================================

async function saveExpenses() {
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to save expenses.");
        return;
    }

    try {
        for (const expense of expenses) {
            await setDoc(
                doc(
                    db,
                    "users",
                    user.uid,
                    "expenses",
                    String(expense.id)
                ),
                expense
            );
        }

        // Keep localStorage as a local backup
        localStorage.setItem(
            "expenses",
            JSON.stringify(expenses)
        );

        console.log("Expenses saved to Firestore.");
    } catch (error) {
        console.error("Error saving expenses:", error);
        alert("Could not save expense to the cloud.");
    }
}


// ==========================================
// GET CURRENT MONTH EXPENSES
// ==========================================

function getCurrentMonthExpenses() {

    const month =
        getSelectedMonth();


    return expenses.filter(
        function (expense) {

            return (
                expense.profile === profile &&
                expense.date.startsWith(month)
            );

        }
    );

}


// ==========================================
// TOTAL
// ==========================================

function calculateTotalExpenses() {

    return getCurrentMonthExpenses()
        .reduce(
            function (total, expense) {

                return total +
                    expense.amount;

            },
            0
        );

}


// ==========================================
// UPDATE DISPLAY
// ==========================================

function updateDisplay() {

    const income =
        getMonthlyIncome();


    const totalExpenses =
        calculateTotalExpenses();


    const balance =
        income - totalExpenses;


    let savingsPercentage = 0;


    if (income > 0) {

        savingsPercentage =
            (balance / income) * 100;

    }


    document.getElementById(
        "incomeDisplay"
    ).textContent =
        formatCurrency(income);


    document.getElementById(
        "expenseDisplay"
    ).textContent =
        formatCurrency(
            totalExpenses
        );


    document.getElementById(
        "remainingDisplay"
    ).textContent =
        formatCurrency(balance);


    document.getElementById(
        "savingsDisplay"
    ).textContent =
        savingsPercentage.toFixed(1) +
        "%";


    updateStatus(
        income,
        totalExpenses,
        balance
    );

displayExpenses();
updateAnalytics();

}


// ==========================================
// STATUS
// ==========================================

function updateStatus(
    income,
    expensesAmount,
    balance
) {

    const status =
        document.getElementById(
            "statusMessage"
        );


    status.className =
        "status-message";


    if (
        income === 0 &&
        expensesAmount === 0
    ) {

        status.classList.add(
            "hidden"
        );

        return;

    }


    status.classList.remove(
        "hidden"
    );


    if (balance < 0) {

        status.classList.add(
            "danger"
        );


        status.textContent =
            `⚠️ You have overspent by ${formatCurrency(
                Math.abs(balance)
            )}.`;

    }

    else if (balance === 0) {

        status.classList.add(
            "warning"
        );


        status.textContent =
            "⚠️ You have used your entire income.";

    }

    else if (
        income > 0 &&
        balance / income >= 0.2
    ) {

        status.classList.add(
            "success"
        );


        status.textContent =
            `🎉 Good job! You have saved ${formatCurrency(
                balance
            )} this month.`;

    }

    else {

        status.classList.add(
            "warning"
        );


        status.textContent =
            `💡 You have ${formatCurrency(
                balance
            )} remaining this month.`;

    }

}


// ==========================================
// DISPLAY EXPENSES
// ==========================================

function displayExpenses() {

    const table =
        document.getElementById(
            "expenseTable"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const tableContainer =
        document.getElementById(
            "tableContainer"
        );


    const expenseCount =
        document.getElementById(
            "expenseCount"
        );


    const search =
        document.getElementById(
            "searchExpense"
        ).value
        .trim()
        .toLowerCase();


    const category =
        document.getElementById(
            "filterCategory"
        ).value;


    const sort =
        document.getElementById(
            "sortExpenses"
        ).value;


    let monthlyExpenses =
        getCurrentMonthExpenses();


    // ======================================
    // SEARCH
    // ======================================

    if (search !== "") {

        monthlyExpenses =
            monthlyExpenses.filter(
                function (expense) {

                    return (
                        expense.name
                            .toLowerCase()
                            .includes(search) ||

                        expense.category
                            .toLowerCase()
                            .includes(search)
                    );

                }
            );

    }


    // ======================================
    // CATEGORY FILTER
    // ======================================

    if (category !== "all") {

        monthlyExpenses =
            monthlyExpenses.filter(
                function (expense) {

                    return (
                        expense.category ===
                        category
                    );

                }
            );

    }


    // ======================================
    // SORT
    // ======================================

    monthlyExpenses.sort(
        function (a, b) {

            switch (sort) {

                case "date-asc":

                    return a.date.localeCompare(
                        b.date
                    );


                case "date-desc":

                    return b.date.localeCompare(
                        a.date
                    );


                case "amount-asc":

                    return a.amount -
                        b.amount;


                case "amount-desc":

                    return b.amount -
                        a.amount;


                case "name-asc":

                    return a.name.localeCompare(
                        b.name
                    );


                case "name-desc":

                    return b.name.localeCompare(
                        a.name
                    );


                default:

                    return 0;

            }

        }
    );


    table.innerHTML = "";


    // ======================================
    // NO RESULTS
    // ======================================

    if (
        monthlyExpenses.length === 0
    ) {

        tableContainer.style.display =
            "none";


        emptyState.style.display =
            "block";


        const hasFilters =
            search !== "" ||
            category !== "all";


        if (hasFilters) {

            emptyState.innerHTML = `

                <div class="empty-icon">
                    🔍
                </div>

                <h3>
                    No matching expenses
                </h3>

                <p>
                    Try changing your search
                    or filter.
                </p>

            `;

        } else {

            emptyState.innerHTML = `

                <div class="empty-icon">
                    🧾
                </div>

                <h3>
                    No expenses recorded
                </h3>

                <p>
                    Add your first expense
                    for this month.
                </p>

            `;

        }


        expenseCount.textContent =
            "No matching expenses.";

        return;

    }


    emptyState.style.display =
        "none";


    tableContainer.style.display =
        "block";


    expenseCount.textContent =
        `${monthlyExpenses.length} expense${
            monthlyExpenses.length !== 1
                ? "s"
                : ""
        } shown`;


    // ======================================
    // TABLE ROWS
    // ======================================

    monthlyExpenses.forEach(
        function (expense) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHTML(
                            expense.name
                        )}
                    </strong>
                </td>

                <td>

                    <span class="category-badge">

                        ${escapeHTML(
                            expense.category
                        )}

                    </span>

                </td>

                <td>
                    ${formatDateDisplay(
                        expense.date
                    )}
                </td>

                <td class="amount-cell">
                    ${formatCurrency(
                        expense.amount
                    )}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick="openEditModal(
                            ${expense.id}
                        )">

                        Edit

                    </button>


                    <button
                        class="delete-btn"
                        onclick="deleteExpense(
                            ${expense.id}
                        )">

                        Delete

                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


// ==========================================
// SEARCH EVENT
// ==========================================

document.getElementById(
    "searchExpense"
).addEventListener(
    "input",
    displayExpenses
);


// ==========================================
// FILTER EVENT
// ==========================================

document.getElementById(
    "filterCategory"
).addEventListener(
    "change",
    displayExpenses
);


// ==========================================
// SORT EVENT
// ==========================================

document.getElementById(
    "sortExpenses"
).addEventListener(
    "change",
    displayExpenses
);


// ==========================================
// RESET FILTERS
// ==========================================

function resetFilters() {

    document.getElementById(
        "searchExpense"
    ).value = "";


    document.getElementById(
        "filterCategory"
    ).value = "all";


    document.getElementById(
        "sortExpenses"
    ).value = "date-desc";


    displayExpenses();

}


// ==========================================
// OPEN EDIT MODAL
// ==========================================

function openEditModal(id) {

    const expense =
        expenses.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!expense) {

        return;

    }


    editingExpenseId =
        id;


    document.getElementById(
        "editName"
    ).value =
        expense.name;


    document.getElementById(
        "editAmount"
    ).value =
        expense.amount;


    document.getElementById(
        "editDate"
    ).value =
        expense.date;


    // Update edit categories

    const categorySelect =
        document.getElementById(
            "editCategory"
        );


    categorySelect.innerHTML = "";


    const categories =
        profile === "student"
            ? studentCategories
            : workerCategories;


    categories.forEach(
        function (category) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;

            option.textContent =
                category;


            categorySelect.appendChild(
                option
            );

        }
    );


    categorySelect.value =
        expense.category;


    document.getElementById(
        "editModal"
    ).classList.add("show");

}


// ==========================================
// CLOSE EDIT MODAL
// ==========================================

function closeEditModal() {

    editingExpenseId = null;


    document.getElementById(
        "editModal"
    ).classList.remove(
        "show"
    );

}


// ==========================================
// SAVE EDITED EXPENSE
// ==========================================

function saveEditedExpense() {

    if (
        editingExpenseId === null
    ) {

        return;

    }


    const name =
        document.getElementById(
            "editName"
        ).value.trim();


    const amount =
        Number(
            document.getElementById(
                "editAmount"
            ).value
        );


    const category =
        document.getElementById(
            "editCategory"
        ).value;


    const date =
        document.getElementById(
            "editDate"
        ).value;


    // Validation

    if (name === "") {

        alert(
            "Please enter the expense name."
        );

        return;

    }


    if (amount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;

    }


    if (category === "") {

        alert(
            "Please select a category."
        );

        return;

    }


    if (date === "") {

        alert(
            "Please select a date."
        );

        return;

    }


    if (
        date.substring(0, 7) !==
        getSelectedMonth()
    ) {

        alert(
            "Expense date must belong to the selected month."
        );

        return;

    }


    // Find expense

    const expense =
        expenses.find(
            function (item) {

                return (
                    item.id ===
                    editingExpenseId
                );

            }
        );


    if (!expense) {

        return;

    }


    // Update

    expense.name =
        name;

    expense.amount =
        amount;

    expense.category =
        category;

    expense.date =
        date;


    saveExpenses();

    closeEditModal();

    updateDisplay();

}


// ==========================================
// DELETE
// ==========================================

function deleteExpense(id) {

    const confirmed =
        confirm(
            "Delete this expense?"
        );


    if (!confirmed) {

        return;

    }


    expenses =
        expenses.filter(
            function (expense) {

                return (
                    expense.id !== id
                );

            }
        );


    saveExpenses();

    updateDisplay();

}


// ==========================================
// CLEAR MONTH
// ==========================================

function clearCurrentMonth() {

    const monthlyExpenses =
        getCurrentMonthExpenses();


    if (
        monthlyExpenses.length === 0
    ) {

        alert(
            "There are no expenses to clear."
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete all ${profile === "student"
                ? "student"
                : "office worker"
            } expenses for this month?`
        );


    if (!confirmed) {

        return;

    }


    const month =
        getSelectedMonth();


    expenses =
        expenses.filter(
            function (expense) {

                return !(
                    expense.profile ===
                        profile &&

                    expense.date.startsWith(
                        month
                    )
                );

            }
        );


    saveExpenses();

    updateDisplay();

}


// ==========================================
// CLEAR FORM
// ==========================================

function clearForm() {

    document.getElementById(
        "expenseName"
    ).value = "";


    document.getElementById(
        "expenseAmount"
    ).value = "";


    document.getElementById(
        "expenseCategory"
    ).value = "";


    document.getElementById(
        "expenseDate"
    ).value =
        getSelectedMonth() +
        "-01";

}


// ==========================================
// MONTH CHANGE
// ==========================================

document.getElementById(
    "selectedMonth"
).addEventListener(
    "change",
    function () {

        document.getElementById(
            "expenseDate"
        ).value =
            getSelectedMonth() +
            "-01";


        updateDisplay();

    }
);


// ==========================================
// DATE DISPLAY
// ==========================================

function formatDateDisplay(
    dateString
) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ==========================================
// CURRENCY
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


// ==========================================
// SECURITY
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ==========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ==========================================

document.getElementById(
    "editModal"
).addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            this
        ) {

            closeEditModal();

        }

    }
);
// ==========================================
// ANALYTICS
// ==========================================

let categoryChart = null;

let categoryBarChart = null;


// ==========================================
// UPDATE ANALYTICS
// ==========================================

function updateAnalytics() {

    const monthlyExpenses =
        getCurrentMonthExpenses();


    updateAnalyticsCards(
        monthlyExpenses
    );


    updateCategoryCharts(
        monthlyExpenses
    );


    updateCategoryBreakdown(
        monthlyExpenses
    );


    updateInsights(
        monthlyExpenses
    );

}


// ==========================================
// ANALYTICS CARDS
// ==========================================

function updateAnalyticsCards(
    monthlyExpenses
) {

    const total =
        monthlyExpenses.reduce(
            function (sum, expense) {

                return sum +
                    expense.amount;

            },
            0
        );


    // --------------------------------------
    // Total
    // --------------------------------------

    document.getElementById(
        "analyticsTotal"
    ).textContent =
        formatCurrency(total);


    // --------------------------------------
    // Transactions
    // --------------------------------------

    document.getElementById(
        "analyticsTransactions"
    ).textContent =
        monthlyExpenses.length;


    // --------------------------------------
    // Average daily spending
    // --------------------------------------

    let average = 0;


    if (monthlyExpenses.length > 0) {

        const selectedMonth =
            getSelectedMonth();


        const today =
            new Date();


        const currentMonth =
            today.getFullYear() +
            "-" +
            String(
                today.getMonth() + 1
            ).padStart(2, "0");


        let days;


        if (
            selectedMonth ===
            currentMonth
        ) {

            days =
                today.getDate();

        } else {

            const parts =
                selectedMonth.split("-");

            const year =
                Number(parts[0]);

            const month =
                Number(parts[1]);


            days =
                new Date(
                    year,
                    month,
                    0
                ).getDate();

        }


        average =
            total / days;

    }


    document.getElementById(
        "analyticsAverage"
    ).textContent =
        formatCurrency(
            Math.round(average)
        );


    // --------------------------------------
    // Highest category
    // --------------------------------------

    const categoryTotals =
        calculateCategoryTotals(
            monthlyExpenses
        );


    const categories =
        Object.keys(
            categoryTotals
        );


    if (categories.length === 0) {

        document.getElementById(
            "analyticsHighest"
        ).textContent =
            "-";

        return;

    }


    const highestCategory =
        categories.reduce(
            function (highest, category) {

                return categoryTotals[
                    category
                ] >
                    categoryTotals[
                        highest
                    ]
                    ? category
                    : highest;

            }
        );


    document.getElementById(
        "analyticsHighest"
    ).textContent =
        highestCategory;

}


// ==========================================
// CATEGORY TOTALS
// ==========================================

function calculateCategoryTotals(
    monthlyExpenses
) {

    const totals = {};


    monthlyExpenses.forEach(
        function (expense) {

            if (
                !totals[
                    expense.category
                ]
            ) {

                totals[
                    expense.category
                ] = 0;

            }


            totals[
                expense.category
            ] += expense.amount;

        }
    );


    return totals;

}


// ==========================================
// CHARTS
// ==========================================

function updateCategoryCharts(
    monthlyExpenses
) {

    const categoryTotals =
        calculateCategoryTotals(
            monthlyExpenses
        );


    const labels =
        Object.keys(
            categoryTotals
        );


    const values =
        Object.values(
            categoryTotals
        );


    // Destroy old charts

    if (categoryChart) {

        categoryChart.destroy();

    }


    if (categoryBarChart) {

        categoryBarChart.destroy();

    }


    // No data

    if (labels.length === 0) {

        return;

    }


    // ======================================
    // PIE CHART
    // ======================================

    const pieContext =
        document.getElementById(
            "categoryChart"
        );


    categoryChart =
        new Chart(
            pieContext,
            {
                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            data: values

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );


    // ======================================
    // BAR CHART
    // ======================================

    const barContext =
        document.getElementById(
            "categoryBarChart"
        );


    categoryBarChart =
        new Chart(
            barContext,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Amount Spent",

                            data: values

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

scales: {
    x: {
        grid: {
            display: false
        },
        ticks: {
            color: "#94a3b8"
        }
    },

    y: {
        beginAtZero: true,

        grid: {
            color: "rgba(148, 163, 184, 0.12)",
            drawBorder: false
        },

        ticks: {
            color: "#94a3b8",

            callback: function (value) {
                return "₹" + value;
            }
        }
    }
},

                    plugins: {

                        legend: {

                            display: false

                        }

                    }

                }

            }
        );

}


// ==========================================
// CATEGORY BREAKDOWN
// ==========================================

function updateCategoryBreakdown(
    monthlyExpenses
) {

    const container =
        document.getElementById(
            "categoryList"
        );


    container.innerHTML = "";


    if (
        monthlyExpenses.length === 0
    ) {

        container.innerHTML = `

            <div class="analytics-empty">

                <div class="analytics-empty-icon">
                    📊
                </div>

                <p>
                    Add expenses to see
                    your category breakdown.
                </p>

            </div>

        `;

        return;

    }


    const totals =
        calculateCategoryTotals(
            monthlyExpenses
        );


    const total =
        monthlyExpenses.reduce(
            function (sum, expense) {

                return sum +
                    expense.amount;

            },
            0
        );


    const sortedCategories =
        Object.entries(totals)
            .sort(
                function (a, b) {

                    return b[1] - a[1];

                }
            );


    sortedCategories.forEach(
        function ([category, amount]) {

            const percentage =
                total > 0
                    ? (amount / total) * 100
                    : 0;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-item";


            item.innerHTML = `

                <div class="category-info">

                    <span class="category-name">

                        ${escapeHTML(
                            category
                        )}

                    </span>

                    <span class="category-value">

                        ${formatCurrency(
                            amount
                        )}

                        (${percentage.toFixed(1)}%)

                    </span>

                </div>


                <div class="progress-bar">

                    <div
                        class="progress-fill"
                        style="width: ${percentage}%">
                    </div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );

}


// ==========================================
// SPENDING INSIGHTS
// ==========================================

function updateInsights(
    monthlyExpenses
) {

    const container =
        document.getElementById(
            "insightsList"
        );


    container.innerHTML = "";


    if (
        monthlyExpenses.length === 0
    ) {

        container.innerHTML = `

            <div class="analytics-empty">

                <div class="analytics-empty-icon">
                    💡
                </div>

                <p>
                    Add some expenses and
                    we'll analyze your spending.
                </p>

            </div>

        `;

        return;

    }


    const insights = [];


    const total =
        monthlyExpenses.reduce(
            function (sum, expense) {

                return sum +
                    expense.amount;

            },
            0
        );


    const categoryTotals =
        calculateCategoryTotals(
            monthlyExpenses
        );


    const categories =
        Object.keys(
            categoryTotals
        );


    // ======================================
    // Highest category
    // ======================================

    const highestCategory =
        categories.reduce(
            function (highest, category) {

                return categoryTotals[
                    category
                ] >
                    categoryTotals[
                        highest
                    ]
                    ? category
                    : highest;

            }
        );


    const highestAmount =
        categoryTotals[
            highestCategory
        ];


    const highestPercentage =
        (highestAmount / total) *
        100;


    insights.push({

        icon: "🔴",

        text:
            `${highestCategory} is your highest
            expense category, accounting for
            ${highestPercentage.toFixed(1)}%
            of your total spending.`

    });


    // ======================================
    // Income insight
    // ======================================

    const income =
        getMonthlyIncome();


    if (income > 0) {

        const balance =
            income - total;


        const savingRate =
            (balance / income) *
            100;


        if (savingRate >= 30) {

            insights.push({

                icon: "🟢",

                text:
                    `Excellent! You're saving
                    ${savingRate.toFixed(1)}%
                    of your income this month.`

            });

        }

        else if (savingRate >= 20) {

            insights.push({

                icon: "🟢",

                text:
                    `You're saving
                    ${savingRate.toFixed(1)}%
                    of your income.
                    That's a healthy start.`

            });

        }

        else if (savingRate >= 0) {

            insights.push({

                icon: "🟠",

                text:
                    `You're currently saving
                    only ${savingRate.toFixed(1)}%
                    of your income.
                    Consider reducing
                    unnecessary spending.`

            });

        }

        else {

            insights.push({

                icon: "🔴",

                text:
                    `You're spending more than
                    your income this month.
                    Your deficit is
                    ${formatCurrency(
                        Math.abs(balance)
                    )}.`

            });

        }

    }


    // ======================================
    // Transaction insight
    // ======================================

    if (
        monthlyExpenses.length >= 5
    ) {

        const averageTransaction =
            total /
            monthlyExpenses.length;


        insights.push({

            icon: "🔵",

            text:
                `You made
                ${monthlyExpenses.length}
                transactions this month,
                averaging
                ${formatCurrency(
                    Math.round(
                        averageTransaction
                    )
                )}
                per transaction.`

        });

    }


    // ======================================
    // Small expense insight
    // ======================================

    if (
        monthlyExpenses.length >= 3
    ) {

        const smallExpenses =
            monthlyExpenses.filter(
                function (expense) {

                    return expense.amount <= 200;

                }
            );


        if (
            smallExpenses.length >= 3
        ) {

            const smallTotal =
                smallExpenses.reduce(
                    function (
                        sum,
                        expense
                    ) {

                        return sum +
                            expense.amount;

                    },
                    0
                );


            insights.push({

                icon: "💡",

                text:
                    `You have made
                    ${smallExpenses.length}
                    small purchases totaling
                    ${formatCurrency(
                        smallTotal
                    )}.
                    Small expenses can add up
                    quickly.`

            });

        }

    }


    // ======================================
    // Display
    // ======================================

    insights.forEach(
        function (insight) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "insight-item";


            item.innerHTML = `

                <span class="insight-icon">
                    ${insight.icon}
                </span>

                <span class="insight-text">
                    ${insight.text}
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}
// ==========================================
// BUDGET SYSTEM
// ==========================================


// ==========================================
// GET BUDGET KEY
// ==========================================

function getBudgetKey() {

    return `${profile}_${getSelectedMonth()}`;

}


// ==========================================
// GET CURRENT BUDGETS
// ==========================================

function getCurrentBudgets() {

    const key =
        getBudgetKey();


    if (!budgets[key]) {

        budgets[key] = {};

    }


    return budgets[key];

}


// ==========================================
// SAVE BUDGETS
// ==========================================

function saveBudgets() {

    const inputs =
        document.querySelectorAll(
            ".budget-input"
        );


    const currentBudgets = {};


    inputs.forEach(
        function (input) {

            const category =
                input.dataset.category;


            const value =
                Number(input.value);


            if (
                value > 0
            ) {

                currentBudgets[
                    category
                ] = value;

            }

        }
    );


    budgets[getBudgetKey()] =
        currentBudgets;


    localStorage.setItem(
        "budgets",
        JSON.stringify(budgets)
    );


    updateBudgetDisplay();

    updateAnalytics();


    alert(
        "Budget saved successfully."
    );

}


// ==========================================
// UPDATE BUDGET DISPLAY
// ==========================================

function updateBudgetDisplay() {

    const budgetList =
        document.getElementById(
            "budgetList"
        );


    if (!budgetList) {

        return;

    }


    const currentBudgets =
        getCurrentBudgets();


    const monthlyExpenses =
        getCurrentMonthExpenses();


    const categories =
        profile === "student"
            ? studentCategories
            : workerCategories;


    budgetList.innerHTML = "";


    let totalBudget = 0;

    let totalSpent = 0;


    categories.forEach(
        function (category) {

            const budget =
                Number(
                    currentBudgets[
                        category
                    ] || 0
                );


            const spent =
                monthlyExpenses
                    .filter(
                        function (expense) {

                            return (
                                expense.category ===
                                category
                            );

                        }
                    )
                    .reduce(
                        function (
                            total,
                            expense
                        ) {

                            return total +
                                Number(
                                    expense.amount
                                );

                        },
                        0
                    );


            totalBudget +=
                budget;


            totalSpent +=
                spent;


            let percentage = 0;


            if (budget > 0) {

                percentage =
                    (spent / budget) *
                    100;

            }


            const progressWidth =
                Math.min(
                    percentage,
                    100
                );


            let progressClass =
                "";


            let statusClass =
                "good";


            let statusText =
                "No budget set";


if (budget > 0) {

    if (spent > budget) {

        progressClass = "danger";

        statusClass = "danger";

        statusText =
            `Budget exceeded by ${formatCurrency(
                spent - budget
            )}`;

    }

    else if (spent === budget) {

        progressClass = "danger";

        statusClass = "danger";

        statusText =
            "Budget fully used";

    }

    else if (percentage >= 80) {

        progressClass = "warning";

        statusClass = "warning";

        statusText =
            `${formatCurrency(
                budget - spent
            )} remaining`;

    }

    else {

        progressClass = "";

        statusClass = "good";

        statusText =
            `${formatCurrency(
                budget - spent
            )} remaining`;

    }

}


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "budget-row";


            row.innerHTML = `

                <div class="budget-row-top">

                    <span class="budget-category">

                        ${escapeHTML(
                            category
                        )}

                    </span>

                    <span class="budget-amount">

                        ${
                            budget > 0
                                ? `${formatCurrency(
                                    spent
                                )} / ${formatCurrency(
                                    budget
                                )}`
                                : "No budget set"
                        }

                    </span>

                </div>


                <div class="budget-input-wrapper">

                    <span>₹</span>

                    <input
                        type="number"
                        min="0"
                        class="budget-input"
                        data-category="${escapeHTML(
                            category
                        )}"
                        value="${
                            budget > 0
                                ? budget
                                : ""
                        }"
                        placeholder="Set budget"
                    >

                </div>


                <div class="budget-progress">

                    <div
                        class="budget-progress-fill ${progressClass}"
                        style="width: ${progressWidth}%">
                    </div>

                </div>


                <div class="budget-row-bottom">

                    <span>

                        ${percentage.toFixed(1)}%
                        used

                    </span>

                    <span
                        class="budget-status ${statusClass}">

                        ${statusText}

                    </span>

                </div>

            `;


            budgetList.appendChild(
                row
            );

        }
    );


    // ======================================
    // SUMMARY
    // ======================================

    const remaining =
        totalBudget -
        totalSpent;


    document.getElementById(
        "totalBudgetDisplay"
    ).textContent =
        formatCurrency(
            totalBudget
        );


    document.getElementById(
        "budgetSpentDisplay"
    ).textContent =
        formatCurrency(
            totalSpent
        );


    document.getElementById(
        "budgetRemainingDisplay"
    ).textContent =
        formatCurrency(
            remaining
        );


    // ======================================
    // INSIGHT
    // ======================================

    updateBudgetInsight(
        totalBudget,
        totalSpent,
        remaining,
        currentBudgets,
        monthlyExpenses
    );

}


// ==========================================
// BUDGET INSIGHT
// ==========================================

function updateBudgetInsight(
    totalBudget,
    totalSpent,
    remaining,
    currentBudgets,
    monthlyExpenses
) {

    const container =
        document.getElementById(
            "budgetInsight"
        );


    if (!container) {

        return;

    }


    if (
        totalBudget === 0
    ) {

        container.innerHTML = `

            💡 <strong>
                Set category budgets above
            </strong>
            to start tracking how well
            you're staying within your limits.

        `;

        return;

    }


    if (
        totalSpent > totalBudget
    ) {

        container.innerHTML = `

            🔴 <strong>
                Your spending has exceeded
                your total budget by
                ${formatCurrency(
                    totalSpent - totalBudget
                )}.
            </strong>

            Consider reducing spending
            in your highest expense categories.

        `;

        return;

    }


    const categories =
        Object.keys(
            currentBudgets
        );


    const exceededCategories =
        categories.filter(
            function (category) {

                const budget =
                    Number(
                        currentBudgets[
                            category
                        ]
                    );


                const spent =
                    monthlyExpenses
                        .filter(
                            function (expense) {

                                return (
                                    expense.category ===
                                    category
                                );

                            }
                        )
                        .reduce(
                            function (
                                total,
                                expense
                            ) {

                                return total +
                                    Number(
                                        expense.amount
                                    );

                            },
                            0
                        );


                return spent > budget;

            }
        );


    if (
        exceededCategories.length > 0
    ) {

        container.innerHTML = `

            🔴 <strong>
                ${exceededCategories.length}
                category${
                    exceededCategories.length > 1
                        ? "ies"
                        : "y"
                }
                exceed your budget.
            </strong>

            Check the category progress
            above and reduce unnecessary spending.

        `;

        return;

    }


    const percentage =
        (totalSpent / totalBudget) *
        100;


    if (
        percentage >= 80
    ) {

        container.innerHTML = `

            🟠 <strong>
                You've used
                ${percentage.toFixed(1)}%
                of your total budget.
            </strong>

            You're getting close to your
            spending limit.

        `;

    }

    else {

        container.innerHTML = `

            🟢 <strong>
                You're within your budget.
            </strong>

            You have
            ${formatCurrency(
                remaining
            )}
            remaining to spend this month.

        `;

    }

}
// ==========================================
// NAVIGATION
// ==========================================

function scrollToSection(sectionId) {

    const section =
        document.getElementById(
            sectionId
        );

    if (!section) {

        return;

    }

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
// ==========================================
// EXPORT EXPENSES TO CSV
// ==========================================

function exportExpensesCSV() {

    const monthlyExpenses =
        getCurrentMonthExpenses();


    if (
        monthlyExpenses.length === 0
    ) {

        alert(
            "There are no expenses to export for this month."
        );

        return;

    }


    const headers = [
        "Expense",
        "Category",
        "Date",
        "Amount",
        "Profile"
    ];


    const rows =
        monthlyExpenses.map(
            function (expense) {

                return [

                    `"${escapeCSV(
                        expense.name
                    )}"`,

                    `"${escapeCSV(
                        expense.category
                    )}"`,

                    `"${expense.date}"`,

                    expense.amount,

                    `"${profile}"`

                ].join(",");

            }
        );


    const csv =
        [
            headers.join(","),
            ...rows
        ].join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `expenses-${profile}-${getSelectedMonth()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


// ==========================================
// CSV ESCAPE
// ==========================================

function escapeCSV(value) {

    return String(value)
        .replace(/"/g, '""');

}
// ==========================================
// AUTHENTICATION
// ==========================================
async function setUserName() {

    const user = auth.currentUser;

    if (!user) return;

    const name = prompt("Enter your name:");

    if (!name || !name.trim()) {
        return;
    }

    try {

        await updateProfile(user, {
            displayName: name.trim()
        });

        const welcomeUser =
            document.getElementById("welcomeUser");

        if (welcomeUser) {
            welcomeUser.textContent =
                `Welcome, ${name.trim()}`;
        }

        console.log(
            "Name updated:",
            name.trim()
        );

    } catch (error) {

        console.error(
            "Could not update name:",
            error
        );

        alert(
            "Could not update your name."
        );

    }
}
function showRegister() {

    document.getElementById("loginForm").style.display =
        "none";

    document.getElementById("registerForm").style.display =
        "block";

}


function showLogin() {

    document.getElementById("registerForm").style.display =
        "none";

    document.getElementById("loginForm").style.display =
        "block";

}


// ==========================================
// REGISTER
// ==========================================

async function registerUser() {

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        ).value;

    const error =
        document.getElementById("registerError");


    error.textContent = "";


    if (!name) {

        error.textContent =
            "Please enter your name.";

        return;

    }


    if (!email) {

        error.textContent =
            "Please enter your email.";

        return;

    }


    if (password.length < 6) {

        error.textContent =
            "Password must be at least 6 characters.";

        return;

    }


    if (password !== confirmPassword) {

        error.textContent =
            "Passwords do not match.";

        return;

    }


    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
        
        await updateProfile(
            userCredential.user,
            {
                displayName: name
            }
            );

        console.log(
            "User created:",
            userCredential.user.uid
        );


        alert(
            "Account created successfully!"
        );


        showLogin();


        document.getElementById(
            "registerName"
        ).value = "";

        document.getElementById(
            "registerEmail"
        ).value = "";

        document.getElementById(
            "registerPassword"
        ).value = "";

        document.getElementById(
            "registerConfirmPassword"
        ).value = "";


    }

catch (error) {

    console.error(
        "Registration error:",
        error
    );

    document.getElementById(
        "registerError"
    ).textContent =
        getAuthErrorMessage(
            error.code
        );

}

}


// ==========================================
// LOGIN
// ==========================================

async function loginUser() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const error =
        document.getElementById("loginError");


    error.textContent = "";


    if (!email || !password) {

        error.textContent =
            "Please enter your email and password.";

        return;

    }


    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        console.log(
            "Logged in:",
            userCredential.user.uid
        );


    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );


        document.getElementById(
            "loginError"
        ).textContent =
            getAuthErrorMessage(
                error.code
            );

    }

}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

    try {

        await signOut(auth);

    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


// ==========================================
// FIREBASE AUTH ERRORS
// ==========================================

function getAuthErrorMessage(
    errorCode
) {

    switch (errorCode) {

        case "auth/email-already-in-use":

            return "This email is already registered.";

        case "auth/invalid-email":

            return "Please enter a valid email address.";

        case "auth/weak-password":

            return "Password is too weak.";

        case "auth/invalid-credential":

            return "Invalid email or password.";

        case "auth/user-not-found":

            return "No account found with this email.";

        case "auth/wrong-password":

            return "Incorrect password.";

        default:

            return "Something went wrong. Please try again.";

    }

}


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
    auth,
    function (user) {

        const authScreen =
            document.getElementById(
                "authScreen"
            );

        const welcomeUser =
            document.getElementById(
                "welcomeUser"
            );


        if (user) {

            console.log(
                "Authenticated user:",
                user.email
            );


            // Hide login/register screen

            authScreen.style.display =
                "none";


            // Show user's name

            if (welcomeUser) {

                const name =
                    user.displayName ||
                    user.email.split("@")[0];

                welcomeUser.textContent =
                    `Welcome, ${name}`;

            }


            // Load the application

            updateDisplay();

        }

        else {

            // Show login/register screen

            authScreen.style.display =
                "flex";


            if (welcomeUser) {

                welcomeUser.textContent =
                    "Welcome";

            }

        }

    }
);
// ==========================================
// EXPOSE ALL FUNCTIONS TO HTML
// ==========================================

window.showRegister = showRegister;
window.showLogin = showLogin;

window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;

window.editName = setUserName;

window.selectProfile = selectProfile;

window.setIncome = setIncome;
window.addExpense = addExpense;

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditedExpense = saveEditedExpense;
window.deleteExpense = deleteExpense;

window.scrollToSection = scrollToSection;

window.saveBudgets = saveBudgets;

window.exportExpensesCSV = exportExpensesCSV;

window.clearCurrentMonth = clearCurrentMonth;

// ==========================================
// COMPATIBILITY ALIASES
// ==========================================

window.setBudget = saveBudgets;
window.clearMonth = clearCurrentMonth;
window.exportCSV = exportExpensesCSV;