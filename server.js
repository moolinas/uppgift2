const express = require("express");
const app = express();
app.use(express.json());     //Middle-ware för att läsa JSON-data

app.use(express.static("uppgift"));
// GET lista med produkter med namn, antal, pris, kategori 
// GET för att hämta för specifik produkt
// POSt för att skapa ny produkt
// PUT för att uppdatera produkt
// DELETE för att ta bort

const products = [     //produkter (parfymer) med namn, antal, pris och katergori
    {
        id: 1,
        name: "Valentino, Born In Roma",
        amount: 20,
        price: "1.099kr",
        cathegory: "EdP"
    },
    {
        id: 2,
        name: "Carolina Herrera, Good Girl",
        amount: 35,
        price: "929kr",
        cathegory: "EdP"
    },
    {
        id: 3,
        name: "Yves Saint Laurent, Black Opium",
        amount: 22,
        price: "769kr",
        cathegory: "EdP"
    },
    {
        id: 4,
        name: "Lancôme, La Vie Est Belle",
        amount: 12,
        price: "1.389kr",
        cathegory: "EdP"
    },
    {
        id: 5,
        name: "Prada, Paradoxe Intense",
        amount: 40,
        price: "1.100kr",
        cathegory: "EdP"
    },
    {
        id: 6,
        name: "Burberry, Goddess",
        amount: 28,
        price: "1.465kr",
        cathegory: "EdP"
    },
    {
        id: 7,
        name: "Rabanne, Million Gold For Her",
        amount: 32,
        price: "1.439kr",
        cathegory: "EdP"
    },
    {
        id: 8,
        name: "DIOR, Miss Dior Essence",
        amount: 24,
        price: "1.680kr",
        cathegory: "EdT"
    },
    {
        id: 9,
        name: "Juicy Couture, Viva La Juicy",
        amount: 20,
        price: "899kr",
        cathegory: "EdP"
    },
    {
        id: 10,
        name: "Jean Paul Gaultier, Classique",
        amount: 22,
        price: "1.169kr",
        cathegory: "EdT"
    }
]


// skapa ny produkt/parfym

app.post("/inventory", (req,res)=> {
    const {id, name, amount, price, cathegory} = req.body;     // lista produkt

    //validering1: kolla att id är med
    if (id === undefined){
        res.status(400).json({
            error:"ID must be included"
        });
        return;
    }

    //validering2: kolla att id är ett nummer
    if (typeof id !== "number"){
        res.status(400).json({
            error: "ID must be a number"
        });
        return;
    }

    // validering2: kolla att namn finns med i request
    if (name === undefined){
        res.status(400).json({
            error:"Name must be included"
        });
        return;
    }

    //validering3: kolla att det är en sträng
    if (typeof name !== "string"){
        res.status(400).json({
            error: "Name must be a string"
        });
        return;
    }

    //validering4: kolla att det är ifyllt
    if (name.trim().length === 0){
        res.status(400).json({
            error: "Name cannot be blank"
        });
        return;
    }

    //validering5: kolla att antal är med
    if (amount === undefined){
        res.status(400).json({
            error:"amount must be included"
        });
        return;
    }

    //validering6: kolla att pris är med
    if (price === undefined){
        res.status(400).json({
            error:"Price must be included"
        });
        return;
    }

    //validering7: kolla att pris är en sträng
    if (typeof price !== "string"){
        res.status(400).json({
            error: "Price must be a string with '111kr' type of format"
        });
        return;
    }

    //validering8: kolla att kategorin är med
    if (cathegory === undefined){
        res.status(400).json({
            error:"Cathegory must be included"
        });
        return;
    }

    //lägg till produkten i listan
    const newProduct = {id, name, amount, price, cathegory};
    products.push(newProduct);

    res.status(201).json({
        message: "Product added successfully!",
        newProduct,     // nya produkten
        totalProducts: products.length     // produktlista med ny produkt
    });
})

app.get("/inventory", (req,res)=>{     // visar alla produkter som finns i listan
    res.status(200).json({
        message: "All products in store: ",
        totalProducts: products.length,     // lista med produkter 
        products: products
    });
});

app.get("/inventory/:id", (req,res)=>{     // sök på specifik produkt med id
    const productId = parseInt(req.params.id);     // hämta Id från URL och gör om till siffra
    const product = products.find(p=> p.id === productId);

    if (isNaN(productId)){     // kolla så att id är ett nummer
        res.status(400).json({
            error: "ID must be a number"
        });
        return;
    }

    if (!product){     // om produkt ej hittas/id nummer ej finns
        return res.status(404).json({
            error: "Could not find product with ID: " + productId
        })};

    

    res.status(200).json({     // produkt hittad
        message: "Product found!",
        product: product
    });
})

app.put("/inventory/:id", (req,res)=>{     // uppdatera produkt
    const productId = parseInt(req.params.id);

    if(isNaN(productId)){                 // validera att det är ett nummer
        return res.status(400).json({
            error: "ID must be a number"
        });
    }

    const product = products.find(p => p.id === productId);     // hitta produkten

    if(!product) {     // om produkt ej finns
        return res.status(404).json ({
            error: "Product not found"
        });
    }
    
    // hämta nya värden
    const {name, amount, price, cathegory} = req.body; 

    // uppdatera
    if(name !== undefined) product.name = name;         //  if-satser för att uppdatera produkt. Tex namn, "om nytt namn angavs, byt namn"
    if(amount !== undefined) product.amount = amount;
    if(price !== undefined) product.price = price;
    if(cathegory !== undefined) product.cathegory = cathegory;

    res.status(200).json ({                  // när produkt blivit uppdaterad skickas meddelande med JSON-objekt
        message: "Product updated",
        updatedProduct: product
    });
});

app.delete("/inventory/:id", (req,res) => {     //skapar endpoint för att radera produkt, ange id för att hitta produkt
    const productId = parseInt(req.params.id);     // gör om från sträng till nummer
    
    if(isNaN(productId)) {     // om id inte är ett nummer (isNaN), skickas error meddelande med JSON-objekt
        return res.status(400).json ({
            error: "ID must be a number"
        });
    }

    const index = products.findIndex(p => p.id === productId); // söker igenom array "products" och returnerar om produkt med rätt id finns. 
                                                               // arrow-funktion som letar efter produkt som har ett id som matchar productId. p = varje produkt i listan, p.id===productId kollar om produktens ID matcher ID som anv angett
    if (index === -1) {    //om produkt inte finns (nr -1 i arrayen, vilket ej finns), skickas error meddelande med JSON-objekt
        return res.status(400).json ({
            error: "Product could not be found"
        });
    }

    const deletedProduct = products.splice(index, 1);     // tar bort produkt. (index, 1) tar bort 1 element från listan
    res.status(200).json ({                // delete lyckades, meddelande med JSON-objekt skickas
        message: "Product deleted!",
        deletedProduct: deletedProduct[0],     // den raderade produkten
        remaingProducts: products.length       // produkter som finns kvar är de som finns kvar i listan
    });
});


app.listen(3000, ()=> {     // server körs på port 3000
    console.log("Servern körs på port 3000");
});