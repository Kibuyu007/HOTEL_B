import express from 'express'
import { deleteUser, getUser, google, login,logout,refetchUser,register, updateUser } from '../Controllers/Auth.js'
import { verifyUser } from '../Middleware/VerifyToken.js'


const router = express.Router()


//Auth Route
router.post('/auth/userRegister',register)
router.post('/auth/userLogin',login)
router.get('/auth/userLogout', logout)
router.post('/auth/google', google)


//User Route
router.get('/user', verifyUser, getUser) 
router.put('/update/:id', verifyUser, updateUser)
router.delete('/delete/:id', verifyUser, deleteUser)
router.get('/refreshToken',refetchUser)




export default router