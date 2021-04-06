require('dotenv').config()
const express=require(`express`)
const axios=require("axios")
const app=express()
const fs=require('fs')
app.use(express.urlencoded({extended:false,limit:'2gb'}))
app.set('view engine','ejs')
app.use(express.static('public'))


// first get route
app.get(`/`,(req,res)=>{
    res.render('index',{result:undefined})
})



// post route
app.post('/',(req,res)=>{

    fs.writeFileSync('voice.mp3',JSON.parse(req.body.filepond).data,{encoding:'base64'},err=>err?console.log(err):false)

    let da=fs.readFileSync('./voice.mp3')
    console.log(da)

    
    // sending mp3 to AssemblyAI 

    axios.post('https://api.assemblyai.com/v2/upload',da,
    {headers:{"authorization": process.env.API_KEY,"Transer-Encoding":"chunked"}})
    .then(result=>{
        axios.post("https://api.assemblyai.com/v2/transcript",{
            "audio_url": result.data.upload_url},
            {headers:{"authorization": process.env.API_KEY,"content-type": "application/json"}})
            .then(got=>{
            console.log(got.data.id)
                setInterval(function(){
                    axios.get(`https://api.assemblyai.com/v2/transcript/${got.data.id}`,{headers:{"authorization": process.env.API_KEY,"content-type": "application/json"}})
                    .then(result=>{//console.log(result.data)
                        
                        
                        result.data.status==="queued"?console.log(result.data.status):
                        result.data.status==="processing"?console.log(result.data.status):
                        result.data.status==="completed"?res.render('index',{result:result.data.text}):
                        res.render('index',{result:"Sorry 💥💥💥"})
                       
                        result.data.status==="completed"?this.clearTimeout():false

                    })
                .catch(err=>console.log(err))},1000)
            })
            .catch(err=>{
            console.log(err)
            })
    })
    .catch(err=>{
        console.log(err)
    })
    
})
app.listen(process.env.PORT??6475,err=>err?console.log(err):console.log('its running on 6475'))
