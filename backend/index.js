require("dotenv").config();
const port = 4000;
const express = require("express");
const { JsonWebTokenError } = require("jsonwebtoken");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const crypto = require("crypto");
const { error } = require("console");
const { GoogleGenAI } = require("@google/genai");

app.use(express.json());
app.use(cors());

// data connection 
mongoose.connect("mongodb+srv://luutrung:Hades2411@cluster0.vr8jajx.mongodb.net/e-commerce");

// create API

app.get("/",(req,res)=>{
    res.send("Express App Is Running")
})

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//create upload endpoint
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})


const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required:true,
    },
    name:{
        type: String,
        required:true,
    },
    image:{
        type: String,
        required:true,
    },
    category:{
        type: String,
        required:true,
    },
    new_price:{
        type: Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        required:true,

    },
    avilable:{
        type:Boolean,
        required:true,
    },
})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id = 1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
        date: new Date(),
        avilable: true,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// create API delete product
app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//create API get all product
app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//user model
const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,

    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

//order model
const Order = mongoose.model('Order',{
    userId:{
        type:String,
        required:true,
    },
    items:{
        type:Array,
        required:true,
    },
    amount:{
        type:Number,
        required:true,
    },
    address:{
        type:Object,
        required:true,
    },
    status:{
        type:String,
        default:"Processing",
    },
    payment:{
        type:Boolean,
        default:false,
    },
    paymentMethod:{
        type:String,
        default:"VNPay",
    },
    txnRef:{
        type:String,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// create endpoint for regitster
app.post('/signup',async (req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"email has been used"})
    }
    let cart = {};
    for(let i = 0; i<300; i++){
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();
    const data = {
        user:{
            id:user.id
        }
    }
    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true, token})
})

//create endpoint for user login
app.post('/login',async(req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if (user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email"});
    }
})

//create endpoint for newcolection
app.get('/newcollections', async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection);
})

//create endpoint for popular in women
app.get('/popularinwomen',async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women fetched");
    res.send(popular_in_women);

})

//create middelware to fetch user
const fetchUser = async(req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"});

    }
    else{
        try{
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        }catch(error){
            res.status(401).send({errors:"Please authenticate using valid token"});
        }
    }
}


//create endpoint for add product in cart
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("Added", req.user.id, req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(!userData){
        return res.status(404).send({errors:"User not found"});
    }
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

//create endpoint to remove product from cart
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("Removed", req.user.id, req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(!userData){
        return res.status(404).send({errors:"User not found"});
    }
    if(userData.cartData[req.body.itemId] > 0){
        userData.cartData[req.body.itemId] -=1;
    }
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

//create endpoint to get cart data
app.post('/getcart',fetchUser,async(req,res)=>{
    console.log("GetCart", req.user.id);
    let userData = await Users.findOne({_id:req.user.id});
    if(!userData){
        return res.status(404).send({errors:"User not found"});
    }
    res.json(userData.cartData);
})

// ===================== VNPay helpers =====================
// sort params alphabetically and encode them the way VNPay expects
function sortObject(obj){
    let sorted = {};
    let str = [];
    for (let key in obj){
        if (obj.hasOwnProperty(key)){
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (let i = 0; i < str.length; i++){
        sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, "+");
    }
    return sorted;
}

// format a date as yyyyMMddHHmmss
function formatDate(date){
    const pad = (n)=> (n < 10 ? '0' : '') + n;
    return date.getFullYear().toString()
        + pad(date.getMonth() + 1)
        + pad(date.getDate())
        + pad(date.getHours())
        + pad(date.getMinutes())
        + pad(date.getSeconds());
}

// default cart (all zeros)
function getDefaultCart(){
    let cart = {};
    for(let i = 0; i < 300; i++){
        cart[i] = 0;
    }
    return cart;
}

//create endpoint to place order and get VNPay payment url
app.post('/placeorder',fetchUser,async(req,res)=>{
    try{
        const order = new Order({
            userId: req.user.id,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
        });
        order.txnRef = order._id.toString();
        await order.save();

        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const tmnCode = process.env.VNP_TMNCODE;
        const secretKey = process.env.VNP_HASHSECRET;
        const vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURNURL;

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = order.txnRef;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order.txnRef;
        vnp_Params['vnp_OrderType'] = 'other';
        // product prices are stored in USD, but VNPay requires the amount in VND.
        // convert USD -> VND, then multiply by 100 as required by VNPay.
        const USD_TO_VND = 25000;
        const amountVnd = Math.round(req.body.amount * USD_TO_VND);
        vnp_Params['vnp_Amount'] = amountVnd * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = formatDate(new Date());
        vnp_Params['vnp_ExpireDate'] = formatDate(new Date(Date.now() + 15 * 60 * 1000));

        vnp_Params = sortObject(vnp_Params);
        const signData = Object.keys(vnp_Params).map(k => k + '=' + vnp_Params[k]).join('&');
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = vnpUrl + '?' + Object.keys(vnp_Params).map(k => k + '=' + vnp_Params[k]).join('&');
        console.log("Order placed", order.txnRef);
        res.json({success:true, paymentUrl, orderId: order._id});
    }catch(e){
        console.log(e);
        res.status(500).json({success:false, errors:"Place order failed"});
    }
})

//create endpoint for VNPay to return result
app.get('/vnpay_return', async(req,res)=>{
    let vnp_Params = {...req.query};
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASHSECRET;
    const signData = Object.keys(vnp_Params).map(k => k + '=' + vnp_Params[k]).join('&');
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const frontend = process.env.FRONTEND_URL;
    const txnRef = req.query['vnp_TxnRef'];
    const rspCode = req.query['vnp_ResponseCode'];

    if(secureHash === signed){
        const order = await Order.findById(txnRef);
        if(order && rspCode === '00'){
            order.payment = true;
            order.status = "Paid";
            await order.save();
            // payment succeeded -> clear the user's cart
            await Users.findOneAndUpdate({_id:order.userId},{cartData:getDefaultCart()});
            return res.redirect(`${frontend}/orders?payment=success`);
        }
        return res.redirect(`${frontend}/orders?payment=failed`);
    }
    return res.redirect(`${frontend}/orders?payment=invalid`);
})

//create endpoint to get current user's orders
app.post('/myorders',fetchUser,async(req,res)=>{
    const orders = await Order.find({userId:req.user.id}).sort({date:-1});
    res.json(orders);
})

//create endpoint for admin to get all orders
app.get('/allorders',async(req,res)=>{
    const orders = await Order.find({}).sort({date:-1});
    res.json(orders);
})

//create endpoint for admin to update order status
app.post('/updateorderstatus',async(req,res)=>{
    await Order.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
    res.json({success:true});
})

//create endpoint for admin to delete an order
app.post('/removeorder',async(req,res)=>{
    await Order.findByIdAndDelete(req.body.orderId);
    console.log("Order removed", req.body.orderId);
    res.json({success:true});
})

// ===================== Chatbot tư vấn (Google Gemini) =====================
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Lời nhắc hệ thống: định nghĩa vai trò, kiến thức FAQ của cửa hàng
const CHAT_SYSTEM_PROMPT = `Bạn là trợ lý tư vấn mua hàng của một cửa hàng thời trang online (web bán quần áo nam, nữ, trẻ em).
Nhiệm vụ của bạn:
1. Tư vấn và gợi ý sản phẩm phù hợp với nhu cầu, ngân sách của khách. Khi khách hỏi về sản phẩm, hãy dùng công cụ search_products để tra cứu hàng có thật trong cửa hàng rồi mới trả lời. Tuyệt đối không bịa ra sản phẩm không có trong kết quả tra cứu.
2. Trả lời các câu hỏi thường gặp (FAQ) của cửa hàng dựa trên thông tin dưới đây.

THÔNG TIN CỬA HÀNG (FAQ):
- Danh mục: men (nam), women (nữ), kid (trẻ em).
- Giá sản phẩm hiển thị bằng USD ($).
- Thanh toán: hỗ trợ thanh toán online qua VNPay. Khách thêm sản phẩm vào giỏ, vào trang Checkout, điền địa chỉ rồi thanh toán.
- Vận chuyển: giao hàng toàn quốc. Đơn hàng được xử lý sau khi thanh toán thành công.
- Đổi trả: hỗ trợ đổi trả trong 7 ngày nếu sản phẩm còn nguyên tem mác, chưa qua sử dụng.
- Thông tin liên hệ: Hootline: 012345678
- Tài khoản: khách cần đăng nhập/đăng ký để mua hàng và xem lịch sử đơn hàng (trang Orders).

QUY TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn, lịch sự.
- QUAN TRỌNG: Tên sản phẩm trong cửa hàng bằng TIẾNG ANH. Khi tra cứu, ĐỪNG dịch nhu cầu của khách thành từ khóa tiếng Việt. Hãy ưu tiên lọc theo category (men=nam, women=nữ, kid=trẻ em) và khoảng giá; chỉ điền keyword khi đó là từ tiếng Anh cụ thể.
- Khi gợi ý sản phẩm, nêu rõ tên và giá ($). Nếu không tìm thấy sản phẩm phù hợp, hãy nói thật và gợi ý khách thử tiêu chí khác.
- Chỉ tư vấn các vấn đề liên quan đến cửa hàng và sản phẩm. Nếu khách hỏi ngoài phạm vi, lịch sự từ chối và hướng khách về việc mua sắm.`;

// Định nghĩa công cụ cho bot tự tra cứu sản phẩm trong database
const CHAT_TOOLS = [
    {
        functionDeclarations: [
            {
                name: "search_products",
                description: "Tìm kiếm sản phẩm trong cửa hàng theo nhu cầu của khách. Dùng khi khách muốn tìm/gợi ý sản phẩm, hỏi giá, hỏi có hàng gì.",
                parametersJsonSchema: {
                    type: "object",
                    properties: {
                        keyword: { type: "string", description: "Từ khóa tìm trong tên sản phẩm. LƯU Ý QUAN TRỌNG: tên sản phẩm trong cửa hàng bằng TIẾNG ANH (ví dụ 'Men Green Solid', 'Striped Flutter Sleeve'). Chỉ điền keyword nếu đó là từ TIẾNG ANH. Nếu khách hỏi bằng tiếng Việt (áo, váy, quần...), hãy ĐỂ TRỐNG trường này và chỉ lọc theo category/giá." },
                        category: { type: "string", enum: ["men", "women", "kid"], description: "Lọc theo danh mục: nam, nữ hoặc trẻ em." },
                        min_price: { type: "number", description: "Giá tối thiểu (USD)." },
                        max_price: { type: "number", description: "Giá tối đa (USD)." }
                    }
                }
            }
        ]
    }
];

// Thực thi công cụ search_products: truy vấn MongoDB
async function runSearchProducts(input){
    const query = { avilable: true };
    if (input.keyword) {
        query.name = { $regex: input.keyword, $options: "i" };
    }
    if (input.category) {
        query.category = input.category;
    }
    if (input.min_price != null || input.max_price != null) {
        query.new_price = {};
        if (input.min_price != null) query.new_price.$gte = input.min_price;
        if (input.max_price != null) query.new_price.$lte = input.max_price;
    }
    const products = await Product.find(query).limit(8);
    // chỉ trả về các trường cần thiết cho bot
    return products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.new_price,
        old_price: p.old_price
    }));
}

// Endpoint chat: nhận lịch sử hội thoại từ frontend, trả về câu trả lời của bot
app.post('/chat', async (req, res) => {
    try {
        // messages: [{role:"user"|"assistant", content:"..."}]
        const messages = Array.isArray(req.body.messages) ? [...req.body.messages] : [];
        if (messages.length === 0) {
            return res.status(400).json({ success: false, errors: "Thiếu nội dung tin nhắn" });
        }

        // chuyển lịch sử hội thoại sang định dạng của Gemini (role "user"/"model", parts[])
        const contents = messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.content) }],
        }));

        // Vòng lặp tool-use: lặp đến khi bot trả lời xong (không gọi công cụ nữa)
        let guard = 0;
        while (guard++ < 5) {
            const response = await genai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction: CHAT_SYSTEM_PROMPT,
                    tools: CHAT_TOOLS,
                },
            });

            const calls = response.functionCalls;
            if (calls && calls.length > 0) {
                // bot muốn tra cứu sản phẩm -> chạy công cụ rồi gửi kết quả lại
                // thêm lượt của model (chứa functionCall) vào hội thoại
                const modelContent = response.candidates?.[0]?.content;
                if (modelContent) contents.push(modelContent);

                const responseParts = [];
                for (const call of calls) {
                    if (call.name === "search_products") {
                        const result = await runSearchProducts(call.args || {});
                        responseParts.push({
                            functionResponse: {
                                name: call.name,
                                response: { products: result },
                            },
                        });
                    }
                }
                contents.push({ role: "user", parts: responseParts });
                continue;
            }

            // bot đã trả lời xong
            const reply = response.text || "Xin lỗi, mình chưa có câu trả lời phù hợp.";
            return res.json({ success: true, reply });
        }
        // quá nhiều vòng lặp -> trả lời an toàn
        return res.json({ success: true, reply: "Xin lỗi, hiện mình chưa thể xử lý yêu cầu này. Bạn thử hỏi lại nhé!" });
    } catch (e) {
        console.log("Chat error:", e.message);
        return res.status(500).json({ success: false, errors: "Chatbot gặp sự cố, vui lòng thử lại sau." });
    }
});


app.listen(port,(error)=>{
    if (!error) {
        console.log("Server Running on Port "+port)
    }
    else
    {
        console.log("Error : "+error)
    }
})