const express = require('express')
const cors = require('cors');
const moment = require('moment-timezone');
const app = express()
app.use(cors({
  origin: '*', 
  methods: 'GET,POST', 
  optionsSuccessStatus: 200 
}))
const port = 2023
const bodyParser = require('body-parser');
const knex = require('knex')({
    client: 'mysql2',
    connection: {
      host : 'localhost',
      user : 'api_rabine_id',
      password :'rgJz^2*4*K!ovxoO',
      database : 'api_api_rabine'
        // host : 'localhost',
        // user : 'root',
        // password :'',
        // database : 'rabine'
    }
  });

app.use(bodyParser.json());


app.get('/',(req, res) => res.send('hello world'))

//get all products
app.get('/product',async (req, res ) => {
    try {
        let data = {
            "undangan":""
        }
        let product = await knex.select('Product_Id','Product_Name','Product_Category','Product_Img','Product_Price','Product_Slug').from('product')
        data.undangan=product
        res.json(data)
        // res.send('aiyoo')
    } catch (e) {
        console.log(e);
    }
})

app.get('/comment/:slug',async (req, res ) => {
    const prodSlug = req.params.slug
    try {
        let mainComments = await knex('comments')
        .select('*')
        .where('Comment_Page','LIKE',prodSlug)
        .andWhere('Comment_Parent','LIKE','')
        .orderBy('Comment_Time', 'desc')

        let replies = await knex('comments')
        .select('*')
        .where('Comment_Page','LIKE',prodSlug)
        .andWhere('Comment_Parent','NOT LIKE','')
        .orderBy('Comment_Time', 'desc')


         const formattedComments = mainComments.map(comment => {
            const commentReplies = replies.filter(reply => reply.Comment_Parent === comment.Comment_Id)
        return {
            Comment_Id: comment.Comment_Id,
            Comment_Time : calcTime(comment.Comment_Time),
            Comment_User : comment.Comment_User,
            Comment_Content: comment.Comment_Content,
            Comment_Parent: comment.Comment_Parent,
            Comment_Confirm: comment.Comment_Confirm,
            replies: commentReplies.map(reply => ({
                Comment_Id: reply.Comment_Id,
                Comment_Time : calcTime(reply.Comment_Time),
                Comment_User : reply.Comment_User,
                Comment_Content: reply.Comment_Content,
                Comment_Parent: reply.Comment_Parent
            }))
        };
    });
         res.json({ comments: formattedComments });
    } catch (e) {
        console.log(e);
    }
})



//get product by slug
app.get('/product/slug/:slug',async (req, res ) => {
    const prodSlug = req.params.slug
    try {
        let data = {
            "undangan":""
        }
        let product = await knex.select('Product_Id','Product_Name','Product_Category','Product_Img','Product_Price','Product_Slug').from('product').where('Product_Slug','LIKE',prodSlug)
        data.undangan=product
        res.json(data)
    } catch (e) {
        console.log(e);
    }
})

function calcTime(waktu){
    const waktuZonaJakarta = moment.tz(waktu, 'Asia/Jakarta');
    
    // Hitung selisih waktu dengan waktu sekarang
    const selisihDetik = moment().diff(waktuZonaJakarta, 'seconds');
    
    // Logika untuk menghasilkan string yang sesuai
    if (selisihDetik < 60) {
        return 'Beberapa detik yang lalu';
    } else if (selisihDetik < 3600) {
        const selisihMenit = Math.floor(selisihDetik / 60);
        return `${selisihMenit} menit yang lalu`;
    } else if (selisihDetik < 86400) {
        const selisihJam = Math.floor(selisihDetik / 3600);
        return `${selisihJam} jam yang lalu`;
    } else {
        const selisihHari = Math.floor(selisihDetik / 86400);
        return `${selisihHari} hari yang lalu`;
    }
}

async function handleComment(req,res){
    const { userName, page, parent, content } = req.body
    knex('comments')
    .insert({ Comment_Id: generateID(5), Comment_User : userName, Comment_Time : getTIme(), Comment_Content : content, Comment_Parent : '', Comment_Page : page, Comment_Type : 'comment', Comment_Confirm : 'Y' })
    .then(() => {
        res.json({
            message:"success",
        })
    })
}

async function handleReply(req,res){
    const { userName, page, parent, content } = req.body
    knex('comments')
    .insert({ Comment_Id: generateID(5), Comment_User : userName, Comment_Time : getTIme(), Comment_Content : content, Comment_Parent : parent, Comment_Page : page, Comment_Type : 'comment', Comment_Confirm : 'Y' })
    .then(() => {
        res.json({
            message:"success",
        })
    })
}

function generateID(length) {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let result = ''
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      result += characters.charAt(randomIndex)
    }
    return result
}

function getTIme(){
    const currentTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    return currentTime
}

app.post('/postComment',handleComment)
app.post('/postReply',handleReply)


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
module.exports = app