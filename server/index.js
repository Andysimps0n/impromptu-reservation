import "dotenv/config"; // 이걸 먼저 해야 함.
import express from 'express';
import cors from 'cors'
import checkHealth from './routes/checkHealth.js'
import rows from './routes/rows.js'

const app = express();
const port = process.env.PORT || 3001;
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000"


// defined before route
app.use(cors({
  origin : webOrigin,
  credentials: true
}));

app.use("/health", checkHealth);
app.use("/rows", rows);

app.use((req,res)=>{
  res.status(404).json({error : "Not Found!"})
})

app.use((error, req, res, next)=>{
  console.error(error.stack);
  res.status(500).json({error : '500 - Internal server error'});
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});