let express =require ("express")
let app =express()
let passport=require("passport")
let jwt=require("jsonwebtoken")
let JWTStrategy=require("passport-jwt").Strategy
let ExtractJWT=require("passport-jwt").ExtractJwt
app.use(express.json())
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*")
    res.header("Access-Control-Allow-Methods",
    "GET,POST,OPTIONS,PUT,PATCH,DELETE,HEAD")
    res.header("Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization")
    next()
})
app.use(passport.initialize())

var port=process.env.PORT||2410
app.listen(port,()=>console.log(`Listening on port ${port}!`))
let {mobiles,users,wishlist,allOrders}=require("./flipkartData.js")

const params={
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: "jwtsecret23647832"
}
const jwtExpirySeconds=300
let strategyAll=new JWTStrategy(params, function(token,done){
    console.log("In jwtstrategy-All",token)
    let user=users.find(u=>u.id===token.id)
    console.log(user,"hi")
    if(!user)
        return done(null,false,{message:"incorrect email or password"})
    else 
        return done(null,user)
})
let strategyAdmin=new JWTStrategy(params, function(token,done){
    console.log("In Jwtstrategy",token)
    let user=users.find(u=>u.id===token.id)
    console.log(user)
    if(!user)
        return done(null,false,{message:"incorrect email or password"})
    else if(user.role!=="admin")
        return done(null,false,{message:"you do not have admin role"})
    else 
        return done(null,user)
})

passport.use("roleAll",strategyAll)
passport.use("roleAdmin",strategyAdmin)

app.post("/flipKart/user",function(req,res){
    let {email,password}=req.body
    console.log(email,password)
    let user=users.find(u=>u.email===email && u.password===password)
    if (user){
        let payload={id:user.id}
        let token=jwt.sign(payload,params.secretOrKey,{
            algorithm:"HS256",
        })
        res.send({token:"bearer "+ token})
      // res.send(token)
    }
    else res.sendStatus(401)
})

app.get("/flipKart/user",passport.authenticate("roleAll",{session:false}),function(req,res){
    console.log("in get /user",req.user)
    res.send(req.user)
})
app.get("/flipKart/wishlist",passport.authenticate("roleAll",{session:false}),function(req,res){
    let user=req.user
    let index=wishlist.findIndex(ele=>ele.user.id===user.id)

    console.log("in get /whilist",req.user,wishlist[index].product)
    res.send(wishlist[index].product)
})
app.post("/flipKart/wishlist",passport.authenticate("roleAll",{session:false}),function(req,res){
    let body=req.body
    let user=req.user
    let index=wishlist.findIndex(ele=>ele.user.id==user.id) 
    let index2=wishlist[index].product.findIndex(ele=>ele.id===body.id)
    console.log(index,index2,body,user,"whishlist")
    index>=0 && index2>=0?
    wishlist[index].product.splice(index2,1)
    :index>=0 && index2<0?
    wishlist[index].product.push(body)
    :
    wishlist.push({user:{...user},product:[{...body}]})
    console.log("in post /wishlist",body,wishlist)
    res.send(wishlist)
})
app.delete("/flipKart/wishlist/:id",passport.authenticate("roleAll",{session:false}),function(req,res){
    let id=req.params.id
    let user=req.user
    let index=wishlist.findIndex(ele=>ele.user.id==user.id) 
    let index2=wishlist[index].product.findIndex(ele=>ele.id===id)
    console.log(index,index2,user,id,"whishlist")
    if(index>=0 && index2>=0)
    {
        wishlist[index].product.splice(index2,1)
        res.send(wishlist)
    }
    else
    res.send("no user found or no product found")
   
})
app.get("/flipKart/orders",passport.authenticate("roleAll",{session:false}),function(req,res){
    let user=req.user
    let index=allOrders.findIndex(ele=>ele.user.id==user.id)
    console.log("in get /orders",req.user,allOrders[index].orders)
    if(index>=0) 
    res.send(allOrders[index].orders)
    else res.send("no order found")
})
app.post("/flipKart/orders",passport.authenticate("roleAll",{session:false}),function(req,res){
    let body=req.body
    let user=req.user
    console.log(body,"post")
    let index=allOrders.findIndex(ele=>ele.user.id==user.id)
    let allOrders2=[]
    allOrders[index].orders=allOrders[index].orders.concat(body)
    allOrders2=allOrders[index].orders.concat(body)
    console.log(allOrders2,"all orders 2")
   // allOrders[index].orders=[...allOrders2]
    console.log("in post /orders",allOrders[index])
    res.send(allOrders)
})
app.get("/flipKart/products/:category/:brand",function(req,res){
    let {category,brand}=req.params
   // let brand=req.params.brand
   console.log(category,brand)
    let assured=req.query.assured
    let indexRam=req.query.ram!=undefined? req.query.ram.indexOf(","):-1
    let ram= indexRam>=0?req.query.ram.split(","):[req.query.ram]
    let indexRat=req.query.rating!=undefined? req.query.rating.indexOf(","):-1
    let rating=indexRat>=0?req.query.rating.split(","):[req.query.rating]
    console.log("rating",rating,ram)
    let indexPrice=req.query.price!=undefined?req.query.price.indexOf(","):-1
    let price=indexPrice>=0? req.query.price.split(","):[req.query.price]
    let sort=req.query.sort
    let page=req.query.page
    let q=req.query.q

    let filterArr=mobiles.filter(ele=>ele.category===category)
    if(brand != undefined) filterArr=filterArr.filter(ele=>ele.brand===brand)
    if (assured) filterArr=filterArr.filter(ele=>ele.assured===true)
    if (ram && ram[0]!==undefined){
        let ram2=ram.map(ele=>ele[2])
        console.log(ram2)
            filterArr=filterArr.filter(ele=>ram2.filter(ele2=>ele2==="6"?+ele.ram>=6:+ele.ram<=+ele2))
    }
    if(rating && rating[0]!==undefined) {
        console.log(rating[1])
        filterArr=filterArr.filter(ele=>rating.filter(ele2=>+ele.rating>=+ele2[2]))}
    if(price && price[0]!==undefined){
        let price2=price.map(ele=>{let index=ele.indexOf("-")
        let low=index>=0?+ele.substring(0,index):+ele
        let high=index>=0?+ele.substring(index+1):0
        return {low:low,high:high}})
       /* let index=price.indexOf("-")
        let low=+price.substring(0,index)
        let high=+price.substring(index+1)
        console.log("high",high,"low",low)*/
        console.log(price2)
        filterArr.filter(ele=>price2.filter(ele2=>ele2.high>=0?ele.price>=ele2.low && ele.price<=ele2.high:ele.price>=ele2.low) )
    }
    if(sort){
        if (sort==="asc") filterArr.sort((s1,s2)=>s1.price - s2.price)
        else if (sort==="desc") filterArr.sort((s1,s2)=>s2.price - s1.price)
        if (sort==="popularity") filterArr.sort((s1,s2)=>s1.popularity - s2.popularity)
    
    }
    if(q) filterArr.filter(ele=ele.name.includes(q))
    //console.log(filterArr,"get")
    let finalArr={data:pagination(filterArr,parseInt(page)),page:page}
   // console.log(finalArr)
    if (finalArr) res.send(finalArr)
    else res.status(404).send("no product found")
})
app.get("/flipKart/Mobile/:search",function(req,res){
    let {search}=req.params
    
    res.send(arr)
})
app.get("/flipKart/deals",function(req,res){
    let arr=mobiles.slice(0,14)
    res.send(arr)
})
app.get("/flipKart/product/:id",function(req,res){
    let {id}=req.params
    let arr=mobiles.find(ele=>ele.id===id)
   // console.log(arr)
    if (arr) res.send(arr)
    else res.status(404).send("no product found")
})

function pagination(obj, page) {
    const postCount = obj.length;
    const perPage = 5;
    const pageCount = Math.ceil(postCount / perPage);
    var resArr = obj;
    resArr = resArr.slice(page * 5 - 5, page * 5);
    return resArr;
  }

