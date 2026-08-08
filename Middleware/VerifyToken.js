import jwt from "jsonwebtoken";


export const verifyUser = (req, res, next) => {

    const token = req.cookies.accessToken;

        if(!token){
    
            return res.status(401).json({message: "you are not authorized.."})
        }
    
    
        jwt.verify(token, process.env.MYCODE, async (err, payload)=> {

            if(err){
               return res.status(401).json({error: "user not found"})
            }

            console.log("Token payload: ", payload);

            id.users = req.body || 

            req.userId = payload.Id
            next()
        });
    }

