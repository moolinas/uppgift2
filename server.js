require("dotenv").config();     // länkar till dotenv (känslig info)
const { Pool } = require("pg");     // länkar till pg (databas)
const express = require ("express");     // länkar till express
const app = express();     // skapar app express
app.use(express.json());     // middleware för att läsa JSON-data

const pool = new Pool ({     // ansluter till databas
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD
});


async function createTables() {     // skapar funktion createTables som vi kan återkalla senare. Async&awat = vänta på detta kommando innan du går vidare, dvs vänta på att databasen hanterat tabellen innan du går vidare (annars kan kod fortsätta köras inna tabell ens skapats)
    
    await pool.query(     // skapra tabell för suppliers och värden
        `CREATE TABLE IF NOT EXISTS suppliers(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        country TEXT NOT NULL)`
    );


    await pool.query(     // skapar tabell för produkter och värden
        `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        inStock INT NOT NULL,
        category TEXT NOT NULL,
        supplier_id INT REFERENCES suppliers(id),   
        createdAt TIMESTAMP
        )`
    );    
}


createTables();

//skapa POST-API för att skapa ny produkt
app.post("/products", async (req,res) =>{
    const name = req.body.name;     //validera att namn finns med
    if (name===undefined){
        res.status(400).json ({
            error: "A new product most include a name",
        });
        return;
    }

    if(typeof name !== "string") {    //validera att name är en string. Typeof = operator för att ta reda på vilken typ ett värde har. "Om name inte är lika med en string"
        res.status(400).json({
            error:"Name must be a string",
        });
        return;
    }

    if(name.trim().length === 0){     //validera att name inte är tomt. Trim() tar bort mellanslag i början och slut. "om length(det anv skrivit i) är lika med 0"
        res.status(400).json({
            error: "Name cannot be blank"
        })
        return;
    }

    const price = req.body.price;     //validera att price finns med
    if (price===undefined){
        res.status(400).json ({
            error: "Price must be included",
        });
        return;
    }

    if(typeof price !== "string") {    //validera att price är en string. Typeof = operator för att ta reda på vilken typ ett värde har. "Om name inte är lika med en string"
        res.status(400).json({
            error:"'Price' must be a string in format: 'xx kr'",
        });
        return;
    }

    if(price.trim().length === 0){     //validera att price inte är tomt. Trim() tar bort mellanslag i början och slut. "om length(det anv skrivit i) är lika med 0"
        res.status(400).json({
            error: "Price cannot be blank"
        })
    }

    const inStock = Number(req.body.inStock);     //validera att antal i lager finns med
    if (req.body.inStock===undefined){
        res.status(400).json ({
            error: "The total amount in stock need to be included",
        });
        return;
    }

    if(isNaN(inStock)) {    //validera att antal i lager är ett nummer
        res.status(400).json({
            error:"The amount of products in stock needs to be written in numbers",
        });
        return;
    }

    if(inStock <=0 ){     //validera att fältet är ifyllt
        res.status(400).json({
            error: "The amount of products in stock needs to be over 0"
        });
        return;
    };

    const category = req.body.category;     //validera att kategori finns med
    if (category===undefined){
        res.status(400).json ({
            error: "A new product most include a category",
        });
        return;
    }

    if(typeof category !== "string") {    //validera att kategori är en string. Typeof = operator för att ta reda på vilken typ ett värde har. "Om kategori inte är lika med en string"
        res.status(400).json({
            error:"Category must be a string",
        });
        return;
    }

    if(category.trim().length === 0){     //validera att kategori inte är tomt. Trim() tar bort mellanslag i början och slut. "om length(det anv skrivit i) är lika med 0"
        res.status(400).json({
            error: "Category cannot be blank"
        })
        return;
    }

    const supplier_id = Number(req.body.supplier_id);     //validera att supplierId finns med
    if (req.body.supplier_id===undefined){
        res.status(400).json ({
            error: "Supplier ID needs to be included",
        });
        return;
    }

    if(isNaN(supplier_id)) {    //validera att supplierId är ett nummer
        res.status(400).json({
            error:"Supplier ID needs to be written in numbers",
        });
        return;
    }

    const supplierCheck = await pool.query(     //validera att id:t existerar
        "SELECT id FROM suppliers WHERE id = $1",
        [supplier_id]
    );

    if(supplierCheck.rowCount === 0) {
        return res.status(404).json({
            error: "Supplier not found"
        });
    }


    const result = await pool.query(     //spara ny produkt i databas
        `INSERT INTO products (name, price, inStock, category, supplier_id, createdAt)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *`,
        [name, price, inStock, category, supplier_id]

        );

        res.status(201).json({     //meddela att ny proukt blivit tillagd
            message: "Product added successfully",
            newProduct: result.rows[0]
        }); 
});


//skapa POST-API för att skapa ny leverantör
app.post("/suppliers", async (req,res)=> {
    const {name, contact_person, email, phone, country} = req.body;

    if(!name || !contact_person || !email || !phone || !country){      //validera att alla värden finns med
        return res.status(400).json ({
            error: "Name, contact_person, email, phone and country needs to be included"
        });
    }

    const result = await pool.query(     //spara ny leverantör
        `INSERT INTO suppliers (name, contact_person, email, phone, country)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [name, contact_person, email, phone, country]
    );
    res.status(201).json({
        message: "Supplier added successfully",
        supplier: result.rows[0]
    });
});

app.get ("/products", async(req,res) => {     //visa lista med produkter + värden och leverantörer + värden (lägger till AS för tydlighet)
    const result = await pool.query(
        `SELECT
        products.id AS product_id,
        products.name AS product_name,
        products.price,
        products.inStock,
        products.category,
        products.createdAt,
        suppliers.id AS supplier_id,
        suppliers.name AS supplier_name,
        suppliers.contact_person AS supplier_contact,
        suppliers.email AS supplier_email,
        suppliers.phone AS supplier_phone,
        suppliers.country AS supplier_country
        FROM products
        JOIN suppliers ON products.supplier_id = suppliers.id
        ORDER BY products.id`
    );
    res.json(result.rows);
    
});


//skapa GET-api för att lista alla leverantörer
app.get("/suppliers", async(req,res) =>{     //visa lista med leverantörer
    const result = await pool.query("SELECT * FROM suppliers ORDER BY id");
    res.json(result.rows);
});

//skapa GET-API för att visa specifik produkt med hjälp av id-nummer
app.get ("/products/:id", async(req,res) => {     
    const id = Number.parseInt(req.params.id);

    if(Number.isNaN(id)){     //validering, id måste vara ett nummer
        res.status(400).json({
            error: "Id must be a number"
        });
        return;
    }

    const result = await pool.query(     // hämtar produkt + leverantör information
        `SELECT
        products.id AS product_id,
        products.name AS product_name,
        products.price,
        products.inStock,
        products.category,
        products.createdAt,
        suppliers.id AS supplier_id,
        suppliers.name AS supplier_name,
        suppliers.contact_person AS supplier_contact,
        suppliers.email AS supplier_email,
        suppliers.phone AS supplier_phone,
        suppliers.country AS supplier_country
        FROM products
        JOIN suppliers ON suppliers.id = products.supplier_id
        WHERE products.id= $1`, [id]
    );

    const products = result.rows[0]; 
    if (products === undefined) {     //om ogiltigt id
        res.status(404).json({
            error: "Product with id: " + [id] + " not found"
        });
        return;
    }

   
    res.json(products);     //visar vald produkt
})


//skapa GET-API för att visa specifik leverantör med hjälp av id-nummer
app.get("/suppliers/:id", async(req,res)=> {
    const supplierId = Number.parseInt(req.params.id);

    if(Number.isNaN(supplierId)){     //validering, supplier ID måste vara ett nummer
        res.status(400).json({
            error: "Id must be a number"
        });
        return;
    }
    
    //visa leverantören med valt ID + antalet produkter den har
    const result = await pool.query(`
        SELECT suppliers.*, COUNT (products.id) AS product_count
        FROM suppliers
        LEFT JOIN products ON products.supplier_id = suppliers.id
        WHERE suppliers.id = $1
        GROUP BY suppliers.id`,
        [supplierId]
    );     
    
        const supplier = result.rows[0];     
    if (!supplier) {     //om ogiltigt id
        res.status(404).json({
            error: "Supplier with id: " + [supplierId] + " not found"
        });
        return;
    }

    res.json(supplier);

});


//skapa GET-API för att visa visa alla produkter som specifik leverantör har, genom ID
app.get("/suppliers/:id/products", async(req,res)=> {  
    
    const supplierId = Number.parseInt(req.params.id);

    if(Number.isNaN(supplierId)){     //validering, supplier ID måste vara ett nummer
        res.status(400).json({
            error: "Id must be a number"
        });
        return;
    }

    //hämta alla produkter som leverantör har via valt ID
    const result = await pool.query(`
        SELECT * FROM products WHERE supplier_id = $1 ORDER BY id`,
    [supplierId]
    );

    res.json(result.rows);

});


//skapa PUT-API för att uppdatera specifik produkt med hjälp av id-nummer
app.put("/products/:id", async(req, res) =>{ 
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id)) {     //validera att id är ett nummer
        res.status(400).json({
            error: "Id must be a number"
        });
        return;
    }

    const {name, price, inStock, category} = req.body;     //validera att alla värden är med
    if (name === undefined || price === undefined || inStock === undefined || category === undefined){
        res.status(400).json ({
            error: "The updated product must include a name, price, amount in stock and category",
        });
        return;
    }

    if(typeof name !== "string" || typeof price !== "string" || typeof category !== "string") {    //validera att värden förutom inStock är en string. Typeof = operator för att ta reda på vilken typ ett värde har. "Om name inte är lika med en string"
        res.status(400).json({
            error:"Name, price and category must be a string",
        });
        return;
    }

    if(name.trim() === "" || price.trim() === "" || category.trim() === ""){     //validera att värden förutom inStock inte är tomt. Trim() tar bort mellanslag i början och slut. "om length(det anv skrivit i) är lika med 0"
        res.status(400).json({
            error: "Name, price and category cannot be blank"
        })
        return;
    }

    const stockNumber = Number(inStock);     //validera att inStock är ett nummer och att det är ett nummer över 0
    if (isNaN(stockNumber) || stockNumber <=0) {
        res.status(400).json({
            error: "inStock must be a number over 0"
        });
        return;
    }

    const result = await pool.query(     // uppdatera
        `UPDATE products 
         SET name = $1, price = $2, inStock = $3, category = $4 
         WHERE id = $5
         RETURNING *`, 

        [name, price, stockNumber, category, id]);
        

    if (result.rowCount === 0) {     //om ogiltigt id 
        res.status(404).json({
            error: "Id cannot be found"
        });
        return;
    }

    res.status(200).json({     //om uppdatering lyckats
        message: "Product updated",
        updatedProduct: result.rows[0]
    });
 });

 //skapa PUT-API för att uppdatera specifik leverantör med hjälp av id-nummer
 app.put("/suppliers/:id", async(req,res)=> { 
    const id = Number.parseInt(req.params.id);

    if (Number.isNaN(id)) {     //validera att id är ett nummer
        res.status(400).json({
            error: "Id must be a number"
        });
        return;
    }

    const {name, contact_person, email, phone, country} = req.body;     //validera att alla värden är med
    if (name === undefined || contact_person === undefined || email === undefined || phone === undefined || country === undefined){
        res.status(400).json ({
            error: "The updated supplier must include a name, contact_person, email, phone and country",
        });
        return;
    }

    if(typeof name !== "string" || typeof contact_person !== "string" || typeof email !== "string" || typeof phone !== "string" || typeof country !== "string") {    //validera att värden är en string. Typeof = operator för att ta reda på vilken typ ett värde har. "Om name inte är lika med en string"
        res.status(400).json({
            error:"Name, contact_person, email, phone and country must be a string",
        });
        return;
    }

    if(name.trim() === "" || contact_person.trim() === "" || email.trim() === "" || phone.trim() === "" || country.trim() === ""){     //validera att värden inte är tomt. Trim() tar bort mellanslag i början och slut. "om length(det anv skrivit i) är lika med 0"
        res.status(400).json({
            error: "Name, contact_person, email, phone and country cannot be blank"
        })
        return;
    }


    const result = await pool.query(     // uppdatera
        `UPDATE suppliers 
         SET name = $1, contact_person = $2, email = $3, phone = $4, country = $5
         WHERE id = $6
         RETURNING *`, 

        [name, contact_person, email, phone, country, id]);
        

    if (result.rowCount === 0) {     //om ogiltigt id 
        res.status(404).json({
            error: "Supplier cannot be found"
        });
        return;
    }

    res.status(200).json({     //om uppdatering lyckats
        message: "Supplier updated",
        updatedSupplier: result.rows[0]
    });
 })

 //skapa DELETE-API för att radera specifik produkt med hjälp av id-nummer
app.delete("/products/:id", async(req,res) =>{
    const id = Number.parseInt(req.params.id);     //validering, id måste vara ett nummer
    if (Number.isNaN(id)) {
        res.status(400).json ({
            error: "Id must be a number"
        });
        return;
    }

    const result = await pool.query("DELETE FROM products WHERE id=$1", [id]);
    if (result.rowCount === 0){     //validering, ifall inget raderades
        res.status(404).json({
            error: "Failed to delete product"
        })
        return;
    }

    res.status(200).json({
        message: "Product deleted"
    });     //om radering lyckats
})


//skapa DELETE-API för att radera specifik leverantör med hjälp av id-nummer
app.delete("/suppliers/:id", async(req,res) =>{     //radera produkt
    const id = Number.parseInt(req.params.id);     //validering, id måste vara ett nummer
    if (Number.isNaN(id)) {
        res.status(400).json ({
            error: "Id must be a number"
        });
        return;
    }
    
    const productCheck = await pool.query( 
        "SELECT * FROM products WHERE supplier_id = $1", [id]
    );

    if(productCheck.rowCount>0){     //om supplier är kopplade till produkter går det ej att radera
        return res.status(400).json({
            error: "Supplier that are linked to products cannot be deleted"
        });
    }

    const result = await pool.query(
        "DELETE FROM suppliers WHERE id=$1", [id]
    );

    if (result.rowCount===0){     //om ogiltigt id
        return res.status(404).json({
            error: "Supplier not found"
        });
    }

    res.status(200).json({
        message: "Supplier deleted"
    });     //om radering lyckats
})


app.listen(4000, () => {
    console.log("server körs på port 4000");
});