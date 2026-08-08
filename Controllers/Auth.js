import user from "../Models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";




//Google
export const google = async (req, res, next) => {
  try {
    const userAuth = await user.findOne({ email: req.body.email });
    if (userAuth) {
      const token = jwt.sign({ id: userAuth._id }, process.env.MYCODE);
      const { password: pass, ...rest } = userAuth._doc;
      res
        .cookie('access_token', token, { httpOnly: true })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hash(generatedPassword, 10);
      const newUser = new user({
        username:
          req.body.username.split(' ').join('').toLowerCase() +
          Math.random().toString(36).slice(-4),
        email: req.body.email,
        password: hashedPassword,
        avatar: req.body.photo,
      });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, process.env.MYCODE);
      const { password: pass, ...rest } = newUser._doc;
      res
        .cookie('access_token', token, { httpOnly: true })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};





//Registering

export const register = async (req, res) => {

  const { username, email, password } = req.body;

  try {
    //if user existing..
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "user is existing.." });
    }

    //Hashing the passowrd
    const hashing = await bcrypt.hash(password, 10);

    //Register User
    const postDatas = await user.create({
      username,
      email,
      password: hashing,
      photo: req.file.originalname
    });
    return res
      .status(200)
      .json({ data: postDatas, message: "User Created successfully.." });

    //
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};







//Login ....
export const login = async (req, res) => {
  
  try {


    //existing user
    const existingUser = await user.findOne({ email: req.body.email });

    if (!existingUser) {
      return res.status(400).json({ error: " user doesnt exist..!!" });
    }

    //Is the Password okay
    const verifyPass = await bcrypt.compare(req.body.password, existingUser.password);
    if (!verifyPass) {
      return res.status(400).json({ error: "Password Do not match" });
    }

    //token
    const token = jwt.sign(
      { Id: existingUser._id },
      process.env.MYCODE,
      { expiresIn: "30m" }
    );

    //cookies
      const { password,...ficha } = existingUser._doc;
      res.cookie(
        "accessToken",
        token,
        {
          httpOnly: true,
        }
      )
      .status(200)
      .send(ficha)
    } 
    
    catch (error) {
    return res.status(401).json({error: "Some is wrong..!!!"});
  }
};






//Logout...
export const logout = async (req, res) => {
  try {
    res.cookie("accessToken", null, {
      httpOnly: true,
      expires: new Date(Date.now() + 60000),
    });

    res.status(200).json({ message: "logout successfully..." });
  } catch (error) {
    res.status(401).json({ error: "internal server error.." });
  }
};






//Get user...
export const getUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Not User..." });
    }


    
    res.status(200).json(user);
   

  } catch (error) {
    res.status(500).json({ error });
  }
};






//update user ...
export const updateUser = async (req, res) => {

  const id = req.params.id
    
      try {

        const userUp = await user.findById(id);
        

        if (!userUp) {

          return res.status(404).json("User not found.juttuioiuui");

        }

        if (req.userId !== userUp._id.toString()) {

          return res.status(401).json("You are not authorized to delete this user.");

        }
        

        if(req.body.password){

            // Check password requirements, e.g., length
          if (req.body.password.length < 4) {
           return res.status(400).json({ error: "Password must be at least 4 characters long." });
         }

          req.body.password = await bcrypt.hash(req.body.password, 10);
        }
        
        const updateUser = await user.findByIdAndUpdate(
          id,
          { $set:{
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            photo: req.body.photo,
          }
          },
          { new: true }
        );

        const {password, ...ficha} = updateUser._doc
    
        return res
          .status(200)
          .send(ficha);
    
      } catch (error) {
        res.status(500).json({ error: "error" });
      }
    }






//Delete User....
export const deleteUser = async (req, res) => {

  const { id } = req.params;

  try {
      
    const userDeli = await user.findById(id);

    if (!userDeli) {
      return res.status(404).json("User not found.");
    }

    if (req.userId !== userDeli._id.toString()) {

      return res.status(401).json({error: "You are not authorized to delete this user."});
    }

    await user.findByIdAndDelete(id);
    return res.status(200).json({message: "User deleted."});


  } catch (error) {

    return res.status(500).json({ error: "An error occurred." });
  }
}






//Refecth User
export const refetchUser = async (req, res) => {
  const token = req.cookies.accessToken;
  jwt.verify(token, process.env.MYCODE,{},(err, data)=>{
    if(err){
      return res.status(400).json(err)
    }

    return res.status(200).json(data)
  })
}
