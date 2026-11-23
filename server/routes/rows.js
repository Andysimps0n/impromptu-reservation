import { Router } from 'express';
import supabase from '../lib/supabase.js'
const router = Router();

async function getRows(){

  const {data, error } = await supabase
    .from("test1")
    .select('*')

  if(error){
    throw error;
  } else {
    return data;
  }


}


router.get("/", async (req, res, next)=>{
  const data = await getRows();
  res.json(data)
});



export default router;