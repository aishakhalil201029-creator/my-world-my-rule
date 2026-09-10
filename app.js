// =====================================================
// MY RULE, MY WORLD
// APP.JS
// =====================================================


// =====================================================
// DATA HELPERS
// =====================================================

function getInventory() {

    try {

        return JSON.parse(
            localStorage.getItem("bags")
        ) || [];

    } catch (error) {

        return [];

    }

}


function getBags() {

    return getInventory();

}


function getOrders() {

    try {

        return JSON.parse(
            localStorage.getItem("orders")
        ) || [];

    } catch (error) {

        return [];

    }

}


// =====================================================
// SAVE DATA
// =====================================================

function saveInventory(inventory) {

    localStorage.setItem(
        "bags",
        JSON.stringify(inventory)
    );

}


function saveOrders(orders) {

    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );

}


// =====================================================
// ITEM HELPERS
// =====================================================

function getItemType(item) {

    if (!item) {

        return "Bag";

    }


    return (
        item.type ||
        item.category ||
        "Bag"
    );

}


function getItemEmoji(item) {

    const type =
        getItemType(item)
            .toLowerCase();


    if (type.includes("shoe")) {

        return "👟";

    }


    if (type.includes("watch")) {

        return "⌚";

    }


    if (type.includes("charm")) {

        return "✨";

    }


    return "👜";

}


function getItemName(item) {

    if (!item) {

        return "Item";

    }


    const type =
        getItemType(item);


    return (
        item.name ||
        item.model ||
        item.brand ||
        type
    );

}


// =====================================================
// UNIQUE ID
// =====================================================

function createInventoryId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


// =====================================================
// FIND INVENTORY ITEM
// =====================================================

function findInventoryItem(order, inventory) {

    if (!order) {

        return null;

    }


    // New orders use itemId

    if (order.itemId) {

        const found =
            inventory.find(
                function(item) {

                    return (
                        item.id ===
                        order.itemId
                    );

                }
            );


        if (found) {

            return found;

        }

    }


    // Older orders may use bagIndex

    if (
        order.bagIndex !== undefined &&
        order.bagIndex !== null &&
        order.bagIndex !== ""
    ) {

        return inventory[
            Number(order.bagIndex)
        ] || null;

    }


    return null;

}


// =====================================================
// DATE HELPERS
// =====================================================

function getTodayDateString() {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


function formatPickupDate(dateString) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// =====================================================
// NOTIFICATIONS
// =====================================================

// Ask for notification permission.

function requestNotificationPermission() {

    if (
        "Notification" in window &&
        Notification.permission === "default"
    ) {

        Notification.requestPermission()
            .catch(function() {

                // Ignore permission errors.

            });

    }

}


// =====================================================
// PICKUP / ORDER DUE NOTIFICATION
// =====================================================

function showPickupNotification(order) {

    const customerName =
        order.customerName ||
        "Customer";


    const itemName =
        order.itemName ||
        order.bag ||
        "item";


    const message =
        `${customerName}'s ${itemName} order is due to be sent today. 📦`;


    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        if ("serviceWorker" in navigator) {

            navigator.serviceWorker.ready
                .then(function(registration) {

                    return registration.showNotification(
                        "📦 Order Due Today — My Rule, My World",
                        {
                            body: message,
                            icon:
                                order.photo ||
                                undefined
                        }
                    );

                })
                .catch(function() {

                    new Notification(
                        "📦 Order Due Today — My Rule, My World",
                        {
                            body: message,
                            icon:
                                order.photo ||
                                undefined
                        }
                    );

                });

        }

        else {

            new Notification(
                "📦 Order Due Today — My Rule, My World",
                {
                    body: message,
                    icon:
                        order.photo ||
                        undefined
                }
            );

        }

    }

    else {

        alert(
            `📦 ORDER DUE TODAY\n\n${message}`
        );

    }

}


// =====================================================
// CHECK ORDER DUE NOTIFICATIONS
// =====================================================

function checkPickupNotifications() {

    const orders =
        getOrders();


    const today =
        getTodayDateString();


    let notificationLog = [];


    try {

        notificationLog =
            JSON.parse(
                localStorage.getItem(
                    "pickupNotifications"
                )
            ) || [];

    } catch (error) {

        notificationLog = [];

    }


    orders.forEach(
        function(order, index) {

            if (!order.pickupDate) {

                return;

            }


            if (
                order.pickupDate !==
                today
            ) {

                return;

            }


            // Completed orders should not receive
            // notifications.

            if (
                order.completed === true
            ) {

                return;

            }


            const reminderId =
                `${order.id || index}-${order.pickupDate}`;


            // Already notified for this order
            // on this date.

            if (
                notificationLog.includes(
                    reminderId
                )
            ) {

                return;

            }


            showPickupNotification(
                order
            );


            notificationLog.push(
                reminderId
            );

        }
    );


    localStorage.setItem(
        "pickupNotifications",
        JSON.stringify(
            notificationLog
        )
    );

}


// =====================================================
// LOW STOCK NOTIFICATION
// =====================================================

function showLowStockNotification(item) {

    const itemName =
        getItemName(item);


    const emoji =
        getItemEmoji(item);


    const message =
        `${itemName} has exactly 1 item left in stock. ${emoji}`;


    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        if ("serviceWorker" in navigator) {

            navigator.serviceWorker.ready
                .then(function(registration) {

                    return registration.showNotification(
                        "⚠️ Low Stock — My Rule, My World",
                        {
                            body: message,
                            icon:
                                item.photo ||
                                undefined
                        }
                    );

                })
                .catch(function() {

                    new Notification(
                        "⚠️ Low Stock — My Rule, My World",
                        {
                            body: message,
                            icon:
                                item.photo ||
                                undefined
                        }
                    );

                });

        }

        else {

            new Notification(
                "⚠️ Low Stock — My Rule, My World",
                {
                    body: message,
                    icon:
                        item.photo ||
                        undefined
                }
            );

        }

    }

    else {

        alert(
            `⚠️ LOW STOCK\n\n${message}`
        );

    }

}


// =====================================================
// GET LOW STOCK NOTIFICATION LOG
// =====================================================

function getLowStockNotificationLog() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "lowStockNotifications"
            )
        ) || [];

    } catch (error) {

        return [];

    }

}


// =====================================================
// SAVE LOW STOCK NOTIFICATION LOG
// =====================================================

function saveLowStockNotificationLog(log) {

    localStorage.setItem(
        "lowStockNotifications",
        JSON.stringify(log)
    );

}


// =====================================================
// CHECK ONE INVENTORY ITEM FOR LOW STOCK
//
// The notification is only triggered when the item
// reaches exactly 1.
//
// If it stays at 1:
//     No repeated notification.
//
// If it goes to 2+:
//     The notification resets.
//
// If it later drops to 1:
//     Notification appears again.
//
// Going 1 -> 0 does NOT reset the notification.
// =====================================================

function checkLowStockNotification(item) {

    if (!item || !item.id) {

        return;

    }


    const stock =
        Number(item.stock) || 0;


    let notificationLog =
        getLowStockNotificationLog();


    const itemId =
        String(item.id);


    // =================================================
    // STOCK IS EXACTLY 1
    // =================================================

    if (stock === 1) {

        if (
            !notificationLog.includes(
                itemId
            )
        ) {

            showLowStockNotification(
                item
            );


            notificationLog.push(
                itemId
            );


            saveLowStockNotificationLog(
                notificationLog
            );

        }

        return;

    }


    // =================================================
    // STOCK IS 2 OR MORE
    //
    // Reset the notification so that if stock later
    // falls to exactly 1, another notification appears.
    // =================================================

    if (stock >= 2) {

        notificationLog =
            notificationLog.filter(
                function(savedId) {

                    return (
                        savedId !==
                        itemId
                    );

                }
            );


        saveLowStockNotificationLog(
            notificationLog
        );

    }

}


// =====================================================
// CHECK ALL INVENTORY FOR LOW STOCK
//
// This also protects against situations where stock
// was changed somewhere else in the app.
// =====================================================

function checkAllLowStockNotifications() {

    const inventory =
        getInventory();


    inventory.forEach(
        function(item) {

            checkLowStockNotification(
                item
            );

        }
    );

}


// =====================================================
// SCHEDULE ORDER DUE CHECK
//
// This checks again around midnight so an order due
// today can be detected while the app is running.
// =====================================================

function schedulePickupCheck() {

    const now =
        new Date();


    const tomorrow =
        new Date(now);


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    tomorrow.setHours(
        0,
        0,
        5,
        0
    );


    const millisecondsUntilMidnight =
        tomorrow.getTime() -
        now.getTime();


    setTimeout(
        function() {

            checkPickupNotifications();

            checkAllLowStockNotifications();

            schedulePickupCheck();

        },
        millisecondsUntilMidnight
    );

}


// =====================================================
// START NOTIFICATION SYSTEM
// =====================================================

requestNotificationPermission();

checkPickupNotifications();

checkAllLowStockNotifications();

schedulePickupCheck();


// =====================================================
// ORDER PAGE
//
// IN STOCK:
// In stock -> category -> inventory/search
//
// PRE-ORDER:
// Pre-order -> category -> description
//
// These two flows are completely separated.
// =====================================================


// =====================================================
// ORDER PAGE ELEMENTS
// =====================================================

const orderForm =
    document.getElementById(
        "order-form"
    );


const orderTypeButtons =
    document.querySelectorAll(
        ".order-type-button[data-order-type]"
    );


const orderTypeInput =
    document.getElementById(
        "order-type"
    );


const inStockItemSection =
    document.getElementById(
        "in-stock-item-section"
    );


const preorderItemSection =
    document.getElementById(
        "preorder-item-section"
    );


// =====================================================
// IN-STOCK ELEMENTS
// =====================================================

const itemTypeButtons =
    document.querySelectorAll(
        "#in-stock-item-section .item-type-button[data-item-type]"
    );


const itemTypeSelect =
    document.getElementById(
        "item-type-select"
    );


const inventorySelectionSection =
    document.getElementById(
        "inventory-selection-section"
    );


const inventorySearch =
    document.getElementById(
        "inventory-search"
    );


const inventoryResults =
    document.getElementById(
        "inventory-results"
    );


const noInventoryResults =
    document.getElementById(
        "no-inventory-results"
    );


const bagSelect =
    document.getElementById(
        "bag"
    );


const selectedBagPreview =
    document.getElementById(
        "selected-bag-preview"
    );


const selectedItemLabel =
    document.getElementById(
        "selected-item-label"
    );


// =====================================================
// PRE-ORDER ELEMENTS
// =====================================================

const preorderTypeButtons =
    document.querySelectorAll(
        ".preorder-type-button[data-preorder-type]"
    );


const preorderItemTypeInput =
    document.getElementById(
        "preorder-item-type"
    );


const preorderDescriptionSection =
    document.getElementById(
        "preorder-description-section"
    );


const preorderDescription =
    document.getElementById(
        "preorder-description"
    );


// =====================================================
// ORDER PAGE STATE
// =====================================================

let selectedOrderType =
    "In stock";


let selectedItemType =
    "";


let selectedPreorderItemType =
    "";


let selectedInventoryIndex =
    "";


// =====================================================
// RESET IN-STOCK SELECTION
// =====================================================

function resetInStockSelection() {

    selectedItemType =
        "";


    selectedInventoryIndex =
        "";


    if (itemTypeSelect) {

        itemTypeSelect.value =
            "";

    }


    if (bagSelect) {

        bagSelect.innerHTML = `

            <option value="">
                Select an item
            </option>

        `;

        bagSelect.value =
            "";

    }


    if (inventorySearch) {

        inventorySearch.value =
            "";

    }


    if (inventoryResults) {

        inventoryResults.innerHTML =
            "";

    }


    if (noInventoryResults) {

        noInventoryResults.style.display =
            "none";

    }


    if (selectedBagPreview) {

        selectedBagPreview.style.display =
            "none";

        selectedBagPreview.innerHTML =
            "";

    }


    if (selectedItemLabel) {

        selectedItemLabel.style.display =
            "none";

        selectedItemLabel.innerHTML =
            "";

    }


    itemTypeButtons.forEach(
        function(button) {

            button.classList.remove(
                "active"
            );

            button.classList.remove(
                "selected"
            );

        }
    );

}


// =====================================================
// RESET PRE-ORDER SELECTION
// =====================================================

function resetPreorderSelection() {

    selectedPreorderItemType =
        "";


    if (preorderItemTypeInput) {

        preorderItemTypeInput.value =
            "";

    }


    preorderTypeButtons.forEach(
        function(button) {

            button.classList.remove(
                "active"
            );

            button.classList.remove(
                "selected"
            );

        }
    );


    if (preorderDescriptionSection) {

        preorderDescriptionSection.style.display =
            "none";

    }


    if (preorderDescription) {

        preorderDescription.value =
            "";

    }

}


// =====================================================
// SET ORDER TYPE
// =====================================================

function switchOrderType(orderType) {

    if (
        orderType !== "In stock" &&
        orderType !== "Pre-order"
    ) {

        orderType =
            "In stock";

    }


    selectedOrderType =
        orderType;


    if (orderTypeInput) {

        orderTypeInput.value =
            orderType;

    }


    orderTypeButtons.forEach(
        function(button) {

            const buttonType =
                button.dataset.orderType;


            const isSelected =
                buttonType ===
                orderType;


            button.classList.toggle(
                "active",
                isSelected
            );


            button.classList.toggle(
                "selected",
                isSelected
            );

        }
    );


    // =================================================
    // IN STOCK
    // =================================================

    if (
        orderType ===
        "In stock"
    ) {

        if (inStockItemSection) {

            inStockItemSection.style.display =
                "block";

        }


        if (preorderItemSection) {

            preorderItemSection.style.display =
                "none";

        }


        resetPreorderSelection();

    }


    // =================================================
    // PRE-ORDER
    // =================================================

    else {

        if (inStockItemSection) {

            inStockItemSection.style.display =
                "none";

        }


        if (preorderItemSection) {

            preorderItemSection.style.display =
                "block";

        }


        resetInStockSelection();

    }

}


// =====================================================
// DISPLAY INVENTORY
// =====================================================

function displayOrderInventory() {

    if (!inventoryResults) {

        return;

    }


    inventoryResults.innerHTML =
        "";


    if (noInventoryResults) {

        noInventoryResults.style.display =
            "none";

    }


    if (
        selectedOrderType !==
        "In stock"
    ) {

        return;

    }


    if (!selectedItemType) {

        if (noInventoryResults) {

            noInventoryResults.style.display =
                "block";


            noInventoryResults.textContent =
                "Choose Bag, Shoe, Watch or Charm above.";

        }

        return;

    }


    const inventory =
        getInventory();


    const searchTerm =
        inventorySearch
            ? inventorySearch.value
                .trim()
                .toLowerCase()
            : "";


    let matchingItems =
        inventory.filter(
            function(item) {

                const itemType =
                    getItemType(item)
                        .toLowerCase()
                        .trim();


                return (
                    itemType ===
                    selectedItemType
                        .toLowerCase()
                        .trim()
                );

            }
        );


    if (searchTerm) {

        matchingItems =
            matchingItems.filter(
                function(item) {

                    const searchableText =
                        [
                            getItemName(item),
                            getItemType(item),
                            item.name || "",
                            item.brand || "",
                            item.colour || "",
                            item.model || "",
                            item.description || ""
                        ]
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        searchTerm
                    );

                }
            );

    }


    if (
        matchingItems.length ===
        0
    ) {

        if (noInventoryResults) {

            noInventoryResults.style.display =
                "block";


            if (searchTerm) {

                noInventoryResults.textContent =
                    "No matching items found in inventory.";

            }

            else {

                noInventoryResults.textContent =
                    `There are no ${selectedItemType.toLowerCase()}s in inventory yet.`;

            }

        }


        return;

    }


    matchingItems.forEach(
        function(item) {

            const originalIndex =
                inventory.indexOf(item);


            const emoji =
                getItemEmoji(item);


            const name =
                getItemName(item);


            const stock =
                Number(item.stock) || 0;


            if (bagSelect) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(
                        originalIndex
                    );


                option.textContent =
                    `${emoji} ${name} — ${stock} in stock`;


                bagSelect.appendChild(
                    option
                );

            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "inventory-result-item";


            button.dataset.index =
                String(
                    originalIndex
                );


            const imageHTML =
                item.photo

                    ? `
                        <img
                            src="${item.photo}"
                            alt="${name}"
                        >
                    `

                    : `
                        <span>
                            ${emoji}
                        </span>
                    `;


            button.innerHTML = `

                <div class="inventory-result-image">

                    ${imageHTML}

                </div>


                <div class="inventory-result-information">

                    <strong>
                        ${name}
                    </strong>


                    ${
                        item.brand
                            ? `
                                <span>
                                    ${item.brand}
                                </span>
                            `
                            : ""
                    }


                    ${
                        item.colour
                            ? `
                                <span>
                                    ${item.colour}
                                </span>
                            `
                            : ""
                    }


                    ${
                        item.model
                            ? `
                                <span>
                                    ${item.model}
                                </span>
                            `
                            : ""
                    }


                    <span class="inventory-result-stock">

                        ${
                            stock > 0
                                ? `🟢 ${stock} in stock`
                                : "🔴 Out of stock"
                        }

                    </span>

                </div>

            `;


            button.addEventListener(
                "click",
                function() {

                    if (
                        selectedOrderType !==
                        "In stock"
                    ) {

                        return;

                    }


                    selectedInventoryIndex =
                        String(
                            originalIndex
                        );


                    if (bagSelect) {

                        bagSelect.value =
                            selectedInventoryIndex;

                    }


                    displaySelectedOrderItem(
                        originalIndex
                    );


                    document
                        .querySelectorAll(
                            "#inventory-results .inventory-result-item"
                        )
                        .forEach(
                            function(otherButton) {

                                otherButton.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );

                }
            );


            inventoryResults.appendChild(
                button
            );

        }
    );

}


// =====================================================
// DISPLAY SELECTED INVENTORY ITEM
// =====================================================

function displaySelectedOrderItem(index) {

    if (!selectedBagPreview) {

        return;

    }


    const inventory =
        getInventory();


    const item =
        inventory[
            Number(index)
        ];


    if (!item) {

        selectedBagPreview.style.display =
            "none";

        selectedBagPreview.innerHTML =
            "";

        return;

    }


    const emoji =
        getItemEmoji(item);


    const itemName =
        getItemName(item);


    selectedBagPreview.style.display =
        "block";


    selectedBagPreview.innerHTML = `

        ${
            item.photo

                ? `
                    <img
                        src="${item.photo}"
                        alt="${itemName}"
                    >
                `

                : `
                    <div class="no-photo-preview">
                        ${emoji}
                    </div>
                `
        }


        <div class="selected-bag-details">

            <p>
                ${emoji}
                ${getItemType(item)}
            </p>


            <h3>
                ${itemName}
            </h3>


            ${
                item.brand

                    ? `
                        <p>
                            ${item.brand}
                        </p>
                    `

                    : ""
            }


            ${
                item.colour

                    ? `
                        <p>
                            ${item.colour}

                            ${
                                item.model
                                    ? " • " +
                                      item.model
                                    : ""
                            }

                        </p>
                    `

                    : item.model

                        ? `
                            <p>
                                ${item.model}
                            </p>
                        `

                        : ""
            }


            ${
                item.description

                    ? `
                        <p>
                            ${item.description}
                        </p>
                    `

                    : ""
            }


            <p class="selected-bag-stock">

                ${
                    Number(item.stock) > 0
                        ? "🟢"
                        : "🔴"
                }

                ${Number(item.stock) || 0}
                in stock

            </p>

        </div>

    `;


    const priceInput =
        document.getElementById(
            "price"
        );


    if (
        priceInput &&
        item.price !== undefined &&
        item.price !== null &&
        item.price !== ""
    ) {

        priceInput.value =
            item.price;

    }


    if (selectedItemLabel) {

        selectedItemLabel.style.display =
            "block";


        selectedItemLabel.innerHTML =
            `${emoji} ${itemName} selected`;

    }

}


// =====================================================
// SELECT IN-STOCK ITEM TYPE
// =====================================================

function selectInStockItemType(type) {

    if (!type) {

        return;

    }


    if (
        selectedOrderType !==
        "In stock"
    ) {

        return;

    }


    selectedItemType =
        type;


    if (itemTypeSelect) {

        itemTypeSelect.value =
            type;

    }


    itemTypeButtons.forEach(
        function(button) {

            const buttonType =
                button.dataset.itemType ||
                "";


            const isSelected =
                buttonType.toLowerCase() ===
                type.toLowerCase();


            button.classList.toggle(
                "active",
                isSelected
            );


            button.classList.toggle(
                "selected",
                isSelected
            );

        }
    );


    selectedInventoryIndex =
        "";


    if (bagSelect) {

        bagSelect.value =
            "";

    }


    if (selectedBagPreview) {

        selectedBagPreview.style.display =
            "none";

        selectedBagPreview.innerHTML =
            "";

    }


    if (selectedItemLabel) {

        selectedItemLabel.style.display =
            "none";

        selectedItemLabel.innerHTML =
            "";

    }


    if (inventorySelectionSection) {

        inventorySelectionSection.style.display =
            "block";

    }


    displayOrderInventory();

}


// =====================================================
// SELECT PRE-ORDER ITEM TYPE
// =====================================================

function selectPreorderItemType(type) {

    if (!type) {

        return;

    }


    if (
        selectedOrderType !==
        "Pre-order"
    ) {

        return;

    }


    selectedPreorderItemType =
        type;


    if (preorderItemTypeInput) {

        preorderItemTypeInput.value =
            type;

    }


    preorderTypeButtons.forEach(
        function(button) {

            const buttonType =
                button.dataset.preorderType ||
                "";


            const isSelected =
                buttonType.toLowerCase() ===
                type.toLowerCase();


            button.classList.toggle(
                "active",
                isSelected
            );


            button.classList.toggle(
                "selected",
                isSelected
            );

        }
    );


    if (preorderDescriptionSection) {

        preorderDescriptionSection.style.display =
            "block";

    }


    if (preorderDescription) {

        preorderDescription.focus();

    }

}


// =====================================================
// ORDER TYPE BUTTON EVENTS
// =====================================================

orderTypeButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const orderType =
                    button.dataset.orderType;


                switchOrderType(
                    orderType
                );

            }
        );

    }
);


// =====================================================
// IN-STOCK ITEM TYPE BUTTON EVENTS
// =====================================================

itemTypeButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const type =
                    button.dataset.itemType;


                if (!type) {

                    return;

                }


                selectInStockItemType(
                    type
                );

            }
        );

    }
);


// =====================================================
// PRE-ORDER ITEM TYPE BUTTON EVENTS
// =====================================================

preorderTypeButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const type =
                    button.dataset.preorderType;


                if (!type) {

                    return;

                }


                selectPreorderItemType(
                    type
                );

            }
        );

    }
);


// =====================================================
// INVENTORY SEARCH
// =====================================================

if (inventorySearch) {

    inventorySearch.addEventListener(
        "input",
        function() {

            if (
                selectedOrderType !==
                "In stock"
            ) {

                return;

            }


            displayOrderInventory();

        }
    );

}


// =====================================================
// HIDDEN INVENTORY SELECT
// =====================================================

if (bagSelect) {

    bagSelect.addEventListener(
        "change",
        function() {

            if (
                selectedOrderType !==
                "In stock"
            ) {

                return;

            }


            if (
                bagSelect.value ===
                ""
            ) {

                selectedInventoryIndex =
                    "";


                if (selectedBagPreview) {

                    selectedBagPreview.style.display =
                        "none";

                    selectedBagPreview.innerHTML =
                        "";

                }


                if (selectedItemLabel) {

                    selectedItemLabel.style.display =
                        "none";

                    selectedItemLabel.innerHTML =
                        "";

                }


                return;

            }


            selectedInventoryIndex =
                bagSelect.value;


            displaySelectedOrderItem(
                bagSelect.value
            );


            document
                .querySelectorAll(
                    "#inventory-results .inventory-result-item"
                )
                .forEach(
                    function(card) {

                        card.classList.toggle(
                            "selected",
                            card.dataset.index ===
                            bagSelect.value
                        );

                    }
                );

        }
    );

}


// =====================================================
// INITIAL ORDER PAGE STATE
// =====================================================

if (orderForm) {

    switchOrderType(
        "In stock"
    );

}


// =====================================================
// SAVE ORDER
// =====================================================

if (orderForm) {

    orderForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // =================================================
            // CUSTOMER
            // =================================================

            const customerNameInput =
                document.getElementById(
                    "customer-name"
                );


            const customerPhoneInput =
                document.getElementById(
                    "customer-phone"
                );


            const customerName =
                customerNameInput
                    ? customerNameInput.value.trim()
                    : "";


            const customerPhone =
                customerPhoneInput
                    ? customerPhoneInput.value.trim()
                    : "";


            // =================================================
            // QUANTITY
            // =================================================

            const quantityInput =
                document.getElementById(
                    "quantity"
                );


            const quantity =
                quantityInput
                    ? Number(
                        quantityInput.value
                    )
                    : 0;


            // =================================================
            // PRICE
            // =================================================

            const priceInput =
                document.getElementById(
                    "price"
                );


            const price =
                priceInput
                    ? priceInput.value
                    : "";


            // =================================================
            // PAYMENT
            // =================================================

            const paymentInput =
                document.getElementById(
                    "payment"
                );


            const payment =
                paymentInput
                    ? paymentInput.value
                    : "Not paid";


            // =================================================
            // NOTES
            // =================================================

            const notesInput =
                document.getElementById(
                    "notes"
                );


            const notes =
                notesInput
                    ? notesInput.value.trim()
                    : "";


            // =================================================
            // PICKUP DATE
            // =================================================

            const pickupDateInput =
                document.getElementById(
                    "pickup-date"
                );


            const pickupDate =
                pickupDateInput
                    ? pickupDateInput.value
                    : "";


            // =================================================
            // BASIC VALIDATION
            // =================================================

            if (!customerName) {

                alert(
                    "Please enter the customer's name."
                );

                return;

            }


            if (
                !quantity ||
                quantity < 1
            ) {

                alert(
                    "Please enter a valid quantity."
                );

                return;

            }


            if (pickupDate) {

                const today =
                    getTodayDateString();


                if (
                    pickupDate <
                    today
                ) {

                    alert(
                        "Pickup date cannot be in the past. 📅"
                    );

                    return;

                }

            }


            // =================================================
            // PRE-ORDER
            // =================================================

            if (
                selectedOrderType ===
                "Pre-order"
            ) {

                if (
                    !selectedPreorderItemType
                ) {

                    alert(
                        "Please choose whether the pre-order is for a Bag, Shoe, Watch or Charm. 👜👟⌚✨"
                    );

                    return;

                }


                const description =
                    preorderDescription
                        ? preorderDescription.value.trim()
                        : "";


                if (!description) {

                    alert(
                        "Please describe the item the customer wants."
                    );


                    if (preorderDescription) {

                        preorderDescription.focus();

                    }


                    return;

                }


                const order = {

                    id:
                        createInventoryId(),


                    customerName:
                        customerName,


                    customerPhone:
                        customerPhone,


                    itemId:
                        "",


                    itemType:
                        selectedPreorderItemType,


                    itemName:
                        description,


                    bag:
                        description,


                    brand:
                        "",


                    colour:
                        "",


                    model:
                        "",


                    description:
                        description,


                    photo:
                        "",


                    quantity:
                        quantity,


                    price:
                        price,


                    payment:
                        payment,


                    notes:
                        notes,


                    bagIndex:
                        null,


                    preorder:
                        true,


                    pickupDate:
                        pickupDate,


                    completed:
                        false,


                    date:
                        new Date()
                            .toLocaleDateString()

                };


                const orders =
                    getOrders();


                orders.push(
                    order
                );


                saveOrders(
                    orders
                );


                alert(
                    "Pre-order saved! ⏳❤️"
                );


                window.location.href =
                    "orders.html";


                return;

            }


            // =================================================
            // IN-STOCK ORDER
            // =================================================

            if (
                selectedOrderType ===
                "In stock"
            ) {

                if (!selectedItemType) {

                    alert(
                        "Please choose Bag, Shoe, Watch or Charm."
                    );

                    return;

                }


                if (
                    selectedInventoryIndex ===
                    ""
                ) {

                    alert(
                        "Please select an item from your inventory."
                    );

                    return;

                }


                const inventory =
                    getInventory();


                const selectedItem =
                    inventory[
                        Number(
                            selectedInventoryIndex
                        )
                    ];


                if (!selectedItem) {

                    alert(
                        "The selected inventory item could not be found."
                    );

                    return;

                }


                const currentStock =
                    Number(
                        selectedItem.stock
                    ) || 0;


                if (
                    quantity >
                    currentStock
                ) {

                    alert(
                        `Only ${currentStock} of this item are currently in stock. If the customer is willing to wait, choose Pre-order instead. ${getItemEmoji(selectedItem)}`
                    );

                    return;

                }


                const order = {

                    id:
                        createInventoryId(),


                    customerName:
                        customerName,


                    customerPhone:
                        customerPhone,


                    itemId:
                        selectedItem.id ||
                        "",


                    itemType:
                        getItemType(
                            selectedItem
                        ),


                    itemName:
                        getItemName(
                            selectedItem
                        ),


                    bag:
                        selectedItem.brand ||
                        selectedItem.name ||
                        selectedItem.model ||
                        "",


                    brand:
                        selectedItem.brand ||
                        "",


                    colour:
                        selectedItem.colour ||
                        "",


                    model:
                        selectedItem.model ||
                        "",


                    description:
                        selectedItem.description ||
                        "",


                    photo:
                        selectedItem.photo ||
                        "",


                    quantity:
                        quantity,


                    price:
                        price ||
                        selectedItem.price ||
                        "",


                    payment:
                        payment,


                    notes:
                        notes,


                    bagIndex:
                        Number(
                            selectedInventoryIndex
                        ),


                    preorder:
                        false,


                    pickupDate:
                        pickupDate,


                    completed:
                        false,


                    date:
                        new Date()
                            .toLocaleDateString()

                };


                const orders =
                    getOrders();


                orders.push(
                    order
                );


                saveOrders(
                    orders
                );


                alert(
                    "Order saved! ❤️"
                );


                window.location.href =
                    "orders.html";

            }

        }
    );

}


// =====================================================
// SAVE / EDIT INVENTORY
// =====================================================

const bagForm =
    document.getElementById(
        "bag-form"
    );


if (bagForm) {

    bagForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const typeInput =
                document.getElementById(
                    "item-type"
                ) ||
                document.getElementById(
                    "type"
                ) ||
                document.getElementById(
                    "category"
                );


            const type =
                typeInput
                    ? typeInput.value.trim()
                    : "Bag";


            const brandElement =
                document.getElementById(
                    "brand"
                );


            const nameElement =
                document.getElementById(
                    "item-name"
                ) ||
                document.getElementById(
                    "name"
                );


            const colourElement =
                document.getElementById(
                    "bag-colour"
                ) ||
                document.getElementById(
                    "colour"
                );


            const modelElement =
                document.getElementById(
                    "model"
                );


            const descriptionElement =
                document.getElementById(
                    "description"
                );


            const priceElement =
                document.getElementById(
                    "bag-price"
                );


            const stockElement =
                document.getElementById(
                    "stock"
                );


            const brand =
                brandElement
                    ? brandElement.value.trim()
                    : "";


            const itemName =
                nameElement
                    ? nameElement.value.trim()
                    : "";


            const colour =
                colourElement
                    ? colourElement.value.trim()
                    : "";


            const model =
                modelElement
                    ? modelElement.value.trim()
                    : "";


            const description =
                descriptionElement
                    ? descriptionElement.value.trim()
                    : "";


            const price =
                priceElement
                    ? priceElement.value
                    : "";


            const stock =
                stockElement
                    ? stockElement.value
                    : "";


            const photoInput =
                document.getElementById(
                    "bag-photo"
                ) ||
                document.getElementById(
                    "item-photo"
                );


            const photoFile =
                photoInput
                    ? photoInput.files[0]
                    : null;


            if (
                !brand &&
                !itemName
            ) {

                alert(
                    "Please enter the item name or brand."
                );

                return;

            }


            if (
                stock === ""
            ) {

                alert(
                    "Please enter the quantity in stock."
                );

                return;

            }


            if (
                Number(stock) < 0
            ) {

                alert(
                    "Stock cannot be negative."
                );

                return;

            }


            function saveItem(photoData) {

                const inventory =
                    getInventory();


                const editingIndex =
                    localStorage.getItem(
                        "editingBagIndex"
                    );


                const existingItem =
                    editingIndex !== null
                        ? inventory[
                            Number(
                                editingIndex
                            )
                        ]
                        : null;


                // Keep the OLD stock so we can detect
                // when the item actually reaches 1.

                const oldStock =
                    existingItem
                        ? Number(
                            existingItem.stock
                        ) || 0
                        : null;


                const item = {

                    id:
                        existingItem &&
                        existingItem.id
                            ? existingItem.id
                            : createInventoryId(),


                    type:
                        type ||
                        "Bag",


                    brand:
                        brand,


                    name:
                        itemName,


                    colour:
                        colour,


                    model:
                        model,


                    description:
                        description,


                    price:
                        price,


                    stock:
                        Number(stock),


                    photo:
                        photoData ||
                        ""

                };


                // EDIT

                if (
                    editingIndex !== null
                ) {

                    const index =
                        Number(
                            editingIndex
                        );


                    if (
                        !photoData &&
                        inventory[index]
                    ) {

                        item.photo =
                            inventory[index]
                                .photo ||
                            "";

                    }


                    inventory[index] =
                        item;


                    localStorage.removeItem(
                        "editingBagIndex"
                    );


                    // =================================================
                    // LOW STOCK NOTIFICATION
                    //
                    // Only check when stock changed.
                    //
                    // Example:
                    // 3 -> 2 = nothing
                    // 2 -> 1 = NOTIFICATION
                    // 1 -> 1 = nothing
                    // 1 -> 2 = reset
                    // 2 -> 1 = NOTIFICATION
                    // =================================================

                    if (
                        oldStock !==
                        Number(item.stock)
                    ) {

                        checkLowStockNotification(
                            item
                        );

                    }


                    alert(
                        `${getItemEmoji(item)} Item updated! ❤️`
                    );

                }


                // NEW ITEM

                else {

                    inventory.push(
                        item
                    );


                    // If a brand-new item starts with exactly
                    // 1 in stock, notify once.

                    if (
                        Number(item.stock) ===
                        1
                    ) {

                        checkLowStockNotification(
                            item
                        );

                    }


                    alert(
                        `${getItemEmoji(item)} Item saved! ❤️`
                    );

                }


                saveInventory(
                    inventory
                );


                window.location.href =
                    "inventory.html";

            }


            if (photoFile) {

                const reader =
                    new FileReader();


                reader.onload =
                    function(event) {

                        saveItem(
                            event.target.result
                        );

                    };


                reader.readAsDataURL(
                    photoFile
                );

            }

            else {

                saveItem("");

            }

        }
    );

}


// =====================================================
// LOAD INVENTORY ITEM FOR EDITING
// =====================================================

const editingBagIndex =
    localStorage.getItem(
        "editingBagIndex"
    );


if (
    editingBagIndex !== null &&
    document.getElementById(
        "bag-form"
    )
) {

    const inventory =
        getInventory();


    const item =
        inventory[
            Number(
                editingBagIndex
            )
        ];


    if (item) {

        const typeInput =
            document.getElementById(
                "item-type"
            ) ||
            document.getElementById(
                "type"
            ) ||
            document.getElementById(
                "category"
            );


        if (typeInput) {

            typeInput.value =
                getItemType(item);

        }


        const brandInput =
            document.getElementById(
                "brand"
            );


        if (brandInput) {

            brandInput.value =
                item.brand ||
                "";

        }


        const nameInput =
            document.getElementById(
                "item-name"
            ) ||
            document.getElementById(
                "name"
            );


        if (nameInput) {

            nameInput.value =
                item.name ||
                "";

        }


        const colourInput =
            document.getElementById(
                "bag-colour"
            ) ||
            document.getElementById(
                "colour"
            );


        if (colourInput) {

            colourInput.value =
                item.colour ||
                "";

        }


        const modelInput =
            document.getElementById(
                "model"
            );


        if (modelInput) {

            modelInput.value =
                item.model ||
                "";

        }


        const descriptionInput =
            document.getElementById(
                "description"
            );


        if (descriptionInput) {

            descriptionInput.value =
                item.description ||
                "";

        }


        const priceInput =
            document.getElementById(
                "bag-price"
            );


        if (priceInput) {

            priceInput.value =
                item.price ||
                "";

        }


        const stockInput =
            document.getElementById(
                "stock"
            );


        if (stockInput) {

            stockInput.value =
                item.stock ??
                "";

        }


        const title =
            document.getElementById(
                "bag-form-title"
            );


        if (title) {

            title.textContent =
                `${getItemEmoji(item)} Edit Item`;

        }


        const subtitle =
            document.getElementById(
                "bag-form-subtitle"
            );


        if (subtitle) {

            subtitle.textContent =
                "Update this item's information";

        }

    }

}


// =====================================================
// DISPLAY INVENTORY PAGE
// =====================================================

const inventoryList =
    document.getElementById(
        "inventory-list"
    );


const inventoryPageSearch =
    document.getElementById(
        "inventory-page-search"
    );


// =====================================================
// RENDER INVENTORY
// =====================================================

function displayInventoryPage() {

    if (!inventoryList) {

        return;

    }


    const inventory =
        getInventory();


    const searchTerm =
        inventoryPageSearch
            ? inventoryPageSearch.value
                .trim()
                .toLowerCase()
            : "";


    inventoryList.innerHTML =
        "";


    // =================================================
    // FILTER INVENTORY
    // =================================================

    const matchingItems =
        inventory.filter(
            function(item) {

                if (!searchTerm) {

                    return true;

                }


                const searchableText =
                    [
                        getItemName(item),
                        getItemType(item),
                        item.name || "",
                        item.brand || "",
                        item.colour || "",
                        item.model || "",
                        item.description || ""
                    ]
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    searchTerm
                );

            }
        );


    // =================================================
    // NO RESULTS
    // =================================================

    if (
        matchingItems.length ===
        0
    ) {

        inventoryList.innerHTML = `

            <div class="empty-orders">

                <div class="empty-icon">
                    🔍
                </div>

                <h2>
                    ${
                        searchTerm
                            ? "No matching items found"
                            : "No inventory yet"
                    }
                </h2>

                <p>
                    ${
                        searchTerm
                            ? "Try searching for another item, brand, colour or model."
                            : "Add your first item to your inventory."
                    }
                </p>

            </div>

        `;

        return;

    }


    // =================================================
    // DISPLAY MATCHING ITEMS
    // =================================================

    matchingItems.forEach(
        function(item) {

            const originalIndex =
                inventory.indexOf(item);


            const itemCard =
                document.createElement(
                    "div"
                );


            itemCard.className =
                "bag-card";


            const emoji =
                getItemEmoji(item);


            const type =
                getItemType(item);


            const displayName =
                getItemName(item);


            itemCard.innerHTML = `

                <div class="bag-photo-placeholder">

                    ${
                        item.photo

                            ? `
                                <img
                                    src="${item.photo}"
                                    alt="${displayName}"
                                >
                            `

                            : `
                                ${emoji}
                            `
                    }

                </div>


                <div class="bag-information">

                    <p class="item-type">

                        ${emoji}
                        ${type}

                    </p>


                    <h2>
                        ${displayName}
                    </h2>


                    ${
                        item.brand &&
                        item.brand !== displayName

                            ? `
                                <p>
                                    ${item.brand}
                                </p>
                            `

                            : ""
                    }


                    ${
                        item.colour

                            ? `
                                <p class="bag-name">

                                    ${item.colour}

                                    ${
                                        item.model
                                            ? " • " +
                                              item.model
                                            : ""
                                    }

                                </p>
                            `

                            : item.model

                                ? `
                                    <p class="bag-name">
                                        ${item.model}
                                    </p>
                                `

                                : ""
                    }


                    ${
                        item.description

                            ? `
                                <p class="bag-description">
                                    ${item.description}
                                </p>
                            `

                            : ""
                    }


                    ${
                        item.price

                            ? `
                                <p class="bag-price">
                                    GH₵${item.price}
                                </p>
                            `

                            : ""
                    }


                    <p class="bag-stock">

                        ${
                            Number(item.stock) > 0
                                ? "🟢"
                                : "🔴"
                        }

                        ${Number(item.stock) || 0}
                        in stock

                    </p>


                    <div class="bag-actions">

                        <button
                            class="edit-bag-button"
                            onclick="editBag(${originalIndex})"
                        >
                            Edit
                        </button>


                        <button
                            class="delete-bag-button"
                            data-index="${originalIndex}"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;


            inventoryList.appendChild(
                itemCard
            );

        }
    );


    // =================================================
    // DELETE BUTTONS
    // =================================================

    const deleteButtons =
        inventoryList.querySelectorAll(
            ".delete-bag-button"
        );


    deleteButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const confirmed =
                        confirm(
                            "Delete this item from your inventory?"
                        );


                    if (!confirmed) {

                        return;

                    }


                    const inventory =
                        getInventory();


                    const deletedItem =
                        inventory[index];


                    inventory.splice(
                        index,
                        1
                    );


                    saveInventory(
                        inventory
                    );


                    // Remove deleted item's low-stock
                    // notification record.

                    if (
                        deletedItem &&
                        deletedItem.id
                    ) {

                        let notificationLog =
                            getLowStockNotificationLog();


                        notificationLog =
                            notificationLog.filter(
                                function(savedId) {

                                    return (
                                        savedId !==
                                        String(
                                            deletedItem.id
                                        )
                                    );

                                }
                            );


                        saveLowStockNotificationLog(
                            notificationLog
                        );

                    }


                    displayInventoryPage();

                }
            );

        }
    );

}


// =====================================================
// INVENTORY SEARCH
// =====================================================

if (inventoryPageSearch) {

    inventoryPageSearch.addEventListener(
        "input",
        function() {

            displayInventoryPage();

        }
    );

}


// =====================================================
// INITIAL INVENTORY DISPLAY
// =====================================================

displayInventoryPage();


// =====================================================
// DELETE INVENTORY
// =====================================================

const deleteButtons =
    document.querySelectorAll(
        ".delete-bag-button"
    );


deleteButtons.forEach(
    function(button) {

        button.addEventListener(
            "click",
            function() {

                const index =
                    Number(
                        button.dataset.index
                    );


                const confirmed =
                    confirm(
                        "Delete this item from your inventory?"
                    );


                if (!confirmed) {

                    return;

                }


                const inventory =
                    getInventory();


                const deletedItem =
                    inventory[index];


                inventory.splice(
                    index,
                    1
                );


                saveInventory(
                    inventory
                );


                // Remove deleted item's notification record.

                if (
                    deletedItem &&
                    deletedItem.id
                ) {

                    let notificationLog =
                        getLowStockNotificationLog();


                    notificationLog =
                        notificationLog.filter(
                            function(savedId) {

                                return (
                                    savedId !==
                                    String(
                                        deletedItem.id
                                    )
                                );

                            }
                        );


                    saveLowStockNotificationLog(
                        notificationLog
                    );

                }


                location.reload();

            }
        );

    }
);


// =====================================================
// EDIT INVENTORY
// =====================================================

function editBag(index) {

    localStorage.setItem(
        "editingBagIndex",
        index
    );


    window.location.href =
        "add-bag.html";

}


// =====================================================
// REMOVE COMPLETED ORDER
//
// When Mom checks an order:
//
// 1. Ask:
//    "Are you sure you want to complete this order?"
//
// 2. If NO:
//    Keep the order.
//
// 3. If YES:
//    Reduce inventory stock if appropriate,
//    then completely remove the order.
// =====================================================

function completeAndRemoveOrder(index) {

    const orders =
        getOrders();


    const inventory =
        getInventory();


    const order =
        orders[index];


    if (!order) {

        return;

    }


    // -------------------------------------------------
    // Confirmation
    // -------------------------------------------------

    const confirmed =
        confirm(
            "Are you sure you want to complete this order?"
        );


    if (!confirmed) {

        return false;

    }


    // -------------------------------------------------
    // Find inventory item.
    //
    // Pre-orders may not have an inventory item,
    // which is completely okay.
    // -------------------------------------------------

    const item =
        findInventoryItem(
            order,
            inventory
        );


    // -------------------------------------------------
    // IN-STOCK ORDER
    //
    // When an in-stock order is completed, the stock
    // is reduced now.
    // -------------------------------------------------

    if (
        !order.preorder &&
        item
    ) {

        const quantity =
            Number(
                order.quantity
            ) || 0;


        const currentStock =
            Number(
                item.stock
            ) || 0;


        if (
            quantity >
            currentStock
        ) {

            alert(
                `Not enough stock to complete this order. You currently have ${currentStock} of this item. ${getItemEmoji(item)}`
            );


            return false;

        }


        // Keep the old stock so we can detect
        // a transition to exactly 1.

        const oldStock =
            currentStock;


        item.stock =
            currentStock -
            quantity;


        // =================================================
        // LOW STOCK NOTIFICATION
        //
        // This fires when completing an order changes:
        //
        // 2 -> 1
        //
        // It will NOT repeat while stock stays at 1.
        // =================================================

        if (
            oldStock !==
            Number(item.stock)
        ) {

            checkLowStockNotification(
                item
            );

        }

    }


    // -------------------------------------------------
    // PRE-ORDER
    //
    // Pre-orders are removed without changing stock.
    // -------------------------------------------------

    // Nothing else is required.


    // -------------------------------------------------
    // Remove the order completely
    // -------------------------------------------------

    orders.splice(
        index,
        1
    );


    saveOrders(
        orders
    );


    saveInventory(
        inventory
    );


    // -------------------------------------------------
    // Clean old pickup notification records
    // -------------------------------------------------

    let notificationLog = [];


    try {

        notificationLog =
            JSON.parse(
                localStorage.getItem(
                    "pickupNotifications"
                )
            ) || [];

    } catch (error) {

        notificationLog = [];

    }


    const orderId =
        order.id ||
        "";


    if (orderId) {

        notificationLog =
            notificationLog.filter(
                function(reminderId) {

                    return !reminderId.startsWith(
                        `${orderId}-`
                    );

                }
            );

    }


    localStorage.setItem(
        "pickupNotifications",
        JSON.stringify(
            notificationLog
        )
    );


    return true;

}


// =====================================================
// DISPLAY ORDERS
// =====================================================

const orderList =
    document.getElementById(
        "order-list"
    );


if (orderList) {

    const orders =
        getOrders();


    orderList.innerHTML =
        "";


    if (
        orders.length ===
        0
    ) {

        orderList.innerHTML = `

            <div class="empty-orders">

                <div class="empty-icon">
                    📦
                </div>

                <h2>
                    No orders yet
                </h2>

                <p>
                    Add your first customer order.
                </p>

            </div>

        `;

    }

    else {

        orders.forEach(
            function(order, index) {

                const orderCard =
                    document.createElement(
                        "div"
                    );


                orderCard.className =
                    order.completed
                        ? "order-card completed"
                        : "order-card";


                const emoji =
                    order.itemType
                        ? getItemEmoji({
                            type:
                                order.itemType
                        })
                        : "👜";


                const itemName =
                    order.itemName ||
                    order.bag ||
                    "Item";


                orderCard.innerHTML = `

                    ${
                        order.photo

                            ? `
                                <img
                                    class="order-bag-photo"
                                    src="${order.photo}"
                                    alt="${itemName}"
                                >
                            `

                            : `
                                <div class="order-bag-photo-placeholder">
                                    ${emoji}
                                </div>
                            `
                    }


                    <div class="order-information">

                        <h2>
                            ${order.customerName || "Customer"}
                        </h2>


                        ${
                            order.customerPhone

                                ? `
                                    <p>
                                        📞 ${order.customerPhone}
                                    </p>
                                `

                                : ""
                        }


                        <p class="order-bag">

                            ${emoji}

                            ${itemName}

                            ${
                                order.itemType
                                    ? " • " +
                                      order.itemType
                                    : ""
                            }

                            ${
                                order.colour
                                    ? " • " +
                                      order.colour
                                    : ""
                            }

                            ${
                                order.model
                                    ? " • " +
                                      order.model
                                    : ""
                            }

                        </p>


                        ${
                            order.preorder

                                ? `
                                    <span class="preorder-badge">
                                        ⏳ PRE-ORDER
                                    </span>
                                `

                                : ""
                        }


                        ${
                            order.description

                                ? `
                                    <p>
                                        ${order.description}
                                    </p>
                                `

                                : ""
                        }


                        <p>
                            🔢 Quantity:
                            ${order.quantity || 0}
                        </p>


                        ${
                            order.price !== undefined &&
                            order.price !== ""

                                ? `
                                    <p>
                                        💰 GH₵${order.price}
                                    </p>
                                `

                                : ""
                        }


                        <p>
                            💳 ${order.payment || "Not paid"}
                        </p>


                        ${
                            order.pickupDate

                                ? `
                                    <p class="pickup-date">

                                        📅 Pickup:
                                        ${formatPickupDate(
                                            order.pickupDate
                                        )}

                                    </p>
                                `

                                : ""
                        }


                        ${
                            order.notes

                                ? `
                                    <p>
                                        📝 ${order.notes}
                                    </p>
                                `

                                : ""
                        }


                        <p class="order-date">

                            📝 Ordered:
                            ${order.date || ""}

                        </p>

                    </div>


                    <div class="order-complete">

                        <label>

                            <input
                                type="checkbox"
                                class="order-checkbox"
                                data-index="${index}"
                            >

                            Order completed

                        </label>

                    </div>

                `;


                orderList.appendChild(
                    orderCard
                );

            }
        );

    }


    // =================================================
    // ORDER CHECKBOXES
    // =================================================

    const orderCheckboxes =
        document.querySelectorAll(
            ".order-checkbox"
        );


    orderCheckboxes.forEach(
        function(checkbox) {

            checkbox.addEventListener(
                "change",
                function() {

                    if (!checkbox.checked) {

                        return;

                    }


                    const index =
                        Number(
                            checkbox.dataset.index
                        );


                    const removed =
                        completeAndRemoveOrder(
                            index
                        );


                    if (!removed) {

                        checkbox.checked =
                            false;

                        return;

                    }


                    location.reload();

                }
            );

        }
    );

}


// =====================================================
// DASHBOARD
// =====================================================

const totalStockDisplay =
    document.getElementById(
        "total-stock"
    );


const totalOrdersDisplay =
    document.getElementById(
        "total-orders"
    );


const pendingOrdersDisplay =
    document.getElementById(
        "pending-orders"
    );


const completedOrdersDisplay =
    document.getElementById(
        "completed-orders"
    );


if (
    totalStockDisplay &&
    totalOrdersDisplay &&
    pendingOrdersDisplay &&
    completedOrdersDisplay
) {

    const inventory =
        getInventory();


    const orders =
        getOrders();


    const totalStock =
        inventory.reduce(
            function(total, item) {

                return (
                    total +
                    (
                        Number(
                            item.stock
                        ) || 0
                    )
                );

            },
            0
        );


    const totalOrders =
        orders.length;


    /*
     * Completed orders are now removed entirely.
     */

    const completedOrders =
        0;


    const pendingOrders =
        orders.filter(
            function(order) {

                return (
                    order.completed !==
                    true
                );

            }
        ).length;


    totalStockDisplay.textContent =
        totalStock;


    totalOrdersDisplay.textContent =
        totalOrders;


    pendingOrdersDisplay.textContent =
        pendingOrders;


    completedOrdersDisplay.textContent =
        completedOrders;

}


// =====================================================
// END OF APP.JS
// =====================================================


