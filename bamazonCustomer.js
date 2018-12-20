require("dotenv").config();
var inquirer = require("inquirer");
var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: process.env.MYSQL_PW,
  database: "bamazon"
});

connection.connect(err => {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  buyingProcess();
  // connection.end();
});

let buyingProcess = () => {
  availableInventory();
  setTimeout(takeCustomerRequest, 10);
};

// function to display what inventory available
let availableInventory = () => {
  connection.query("SELECT * FROM products", (err, SQLresults) => {
    if (err) throw err;
    console.log(
      "\n" +
        "Item ID".padEnd(6) +
        "|" +
        "Product Name".padEnd(22) +
        "|" +
        "Department Name".padEnd(17) +
        "|" +
        "Price".padEnd(11) +
        "|" +
        "Stock Qty"
    );
    console.log(
      "-------------------------------------------------------------------------"
    );

    for (var i = 0; i < SQLresults.length; i++) {
      console.log(
        SQLresults[i].item_id.toString().padEnd(6) +
          " | " +
          SQLresults[i].product_name.toString().padEnd(20) +
          " | " +
          SQLresults[i].department_name.toString().padEnd(15) +
          " | " +
          SQLresults[i].price.toString().padEnd(10) +
          "|" +
          SQLresults[i].stock_quantity.toString().padStart(5)
      );
    }
  });
};

//   function that prompts user for ID of product to buy and quantity
let takeCustomerRequest = params => {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Whats the ID of the product you want to buy?",
        name: "item_id"
      },
      {
        type: "input",
        message: "How many units of this product do you want to buy?",
        name: "quantity_to_buy"
      }
    ])
    .then(answers => {
      connection.query(
        "SELECT * FROM products WHERE item_id = ?",
        [answers.item_id],
        (err, SQLresults) => {
          if (err) throw err;
          for (var i = 0; i < SQLresults.length; i++) {
            if (answers.quantity_to_buy > SQLresults[i].stock_quantity) {
              console.log("We don't have enough in stock :(");
              console.log(
                "\n" +
                  "Item ID".padEnd(6) +
                  "|" +
                  "Product Name".padEnd(22) +
                  "|" +
                  "Department Name".padEnd(17) +
                  "|" +
                  "Price".padEnd(11) +
                  "|" +
                  "Stock Qty"
              );
              console.log(
                "-------------------------------------------------------------------------"
              );
              console.log(
                SQLresults[i].item_id.toString().padEnd(6) +
                  " | " +
                  SQLresults[i].product_name.toString().padEnd(20) +
                  " | " +
                  SQLresults[i].department_name.toString().padEnd(15) +
                  " | " +
                  SQLresults[i].price.toString().padEnd(10) +
                  "|" +
                  SQLresults[i].stock_quantity.toString().padStart(5)
              );
            } else if (
              answers.quantity_to_buy <= SQLresults[i].stock_quantity
            ) {
              console.log("Your order has been placed!");
              let unitsPurchased = Number(answers.quantity_to_buy);
              let newStockQuantity =
                SQLresults[i].stock_quantity - unitsPurchased;
              updateProductsTable(newStockQuantity, SQLresults[i].item_id);
              let costOfOrder = unitsPurchased * SQLresults[i].price;
              // Notify customer of total cost of their order
              console.log("Cost of your order: " + costOfOrder);
              inquirer
                .prompt([
                  {
                    type: "list",
                    message: "Do you want to buy another product?",
                    name: "continue_purchasing",
                    choices: ["Yes", "No"]
                  }
                ])
                .then(answers => {
                  if (answers.continue_purchasing == "Yes") buyingProcess();
                  else if (answers.continue_purchasing == "No") {
                    connection.end();
                    console.log(
                      "Thank you for your business! Come see us again!"
                    );
                  }
                });
            }
          }
        }
      );
    });
};

// Update products table in bamazon database to reflect customer order
let updateProductsTable = (newStockQuantity, customerItemID) => {
  connection.query(
    "UPDATE products SET ? WHERE ?",
    [
      {
        stock_quantity: newStockQuantity
      },
      {
        item_id: customerItemID
      }
    ],
    err => {
      if (err) throw console.log("Here's the issue: " + err);
    }
  );
};
