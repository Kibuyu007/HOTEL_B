import  jwt  from "jsonwebtoken";


export const generateToken = async(res, userId) => {

    const token = jwt.sign({userId}, process.env.MYCODE, {
        expiresIn:'1d'
    });


    res.cookie('jwt',token, {
        httpOnly: true,
        source: process.env.MYCODEE !== 'develepment',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000
    })
}