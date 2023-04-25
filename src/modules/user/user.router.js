import { Router } from "express";
import * as userController from './controller/user.js'
const router = Router()




router.get('/', (req ,res)=>{
    res.status(200).json({message:"User Module"})
})





export default router